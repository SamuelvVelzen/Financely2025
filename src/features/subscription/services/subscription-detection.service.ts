import {
  FREQUENCY_DAY_RANGES,
  SUBSCRIPTION_FREQUENCIES,
  type ISubscriptionFrequency,
} from "@/features/subscription/config/frequencies";
import type {
  IDetectSubscriptionsOptions,
  ISubscriptionCandidate,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

type IRawTransaction = {
  id: string;
  name: string;
  amount: { toNumber: () => number; toString: () => string };
  currency: string;
  transactionDate: Date;
  type: "EXPENSE" | "INCOME";
};

const TRANSACTION_SELECT = {
  id: true,
  name: true,
  amount: true,
  currency: true,
  transactionDate: true,
  type: true,
} as const;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/g, "")
    .replace(/\b\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}\b/g, "")
    .replace(/\s*#\s*\d+/g, "")
    .replace(/\s*ref\s*:?\s*\d+/gi, "")
    .replace(/\s+$/, "")
    .trim();
}

function groupKey(tx: Pick<IRawTransaction, "name" | "type" | "currency">) {
  return `${normalizeName(tx.name)}::${tx.type}::${tx.currency}`;
}

function areAmountsConsistent(
  amounts: number[],
  tolerancePercent = 5,
): boolean {
  if (amounts.length < 2) return false;
  const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  if (avg === 0) return false;
  return amounts.every(
    (a) => Math.abs(a - avg) / avg <= tolerancePercent / 100,
  );
}

function detectFrequency(dates: Date[]): ISubscriptionFrequency | null {
  if (dates.length < 2) return null;

  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const diffMs = dates[i].getTime() - dates[i - 1].getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    intervals.push(diffDays);
  }

  const avgInterval =
    intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

  for (const freq of SUBSCRIPTION_FREQUENCIES) {
    const range = FREQUENCY_DAY_RANGES[freq];
    if (avgInterval >= range.min && avgInterval <= range.max) {
      const allWithinRange = intervals.every(
        (interval) =>
          interval >= range.min * 0.7 && interval <= range.max * 1.3,
      );
      if (allWithinRange) return freq;
    }
  }

  return null;
}

function groupTransactions(
  transactions: IRawTransaction[],
): Map<string, IRawTransaction[]> {
  const groups = new Map<string, IRawTransaction[]>();

  for (const tx of transactions) {
    const key = groupKey(tx);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tx);
  }

  return groups;
}

function buildCandidatesFromGroups(
  groups: Map<string, IRawTransaction[]>,
  dismissedSet: Set<string>,
  targetKeys?: Set<string>,
): ISubscriptionCandidate[] {
  const candidates: ISubscriptionCandidate[] = [];

  for (const [key, txns] of groups) {
    if (targetKeys && !targetKeys.has(key)) continue;
    if (txns.length < 2) continue;

    const [normalized, type] = key.split("::");
    if (dismissedSet.has(`${normalized}::${type}`)) continue;

    const amounts = txns.map((t) => t.amount.toNumber());
    if (!areAmountsConsistent(amounts)) continue;

    const sortedDates = txns
      .map((t) => t.transactionDate)
      .sort((a, b) => a.getTime() - b.getTime());

    const frequency = detectFrequency(sortedDates);
    if (!frequency) continue;

    const avgAmount =
      amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

    candidates.push({
      normalizedName: normalized,
      displayName: txns[0].name,
      type: txns[0].type,
      averageAmount: avgAmount.toFixed(2),
      currency: txns[0].currency,
      frequency,
      occurrences: txns.length,
      transactionIds: txns.map((t) => t.id),
      firstDate: sortedDates[0].toISOString(),
      lastDate: sortedDates[sortedDates.length - 1].toISOString(),
    });
  }

  candidates.sort((a, b) => b.occurrences - a.occurrences);

  return candidates;
}

async function loadDismissedSet(
  userId: string,
  workspaceId: IWorkspaceId,
): Promise<Set<string>> {
  const dismissals = await prisma.subscriptionDismissal.findMany({
    where: { userId, workspaceId },
    select: { normalizedName: true, type: true },
  });

  return new Set(dismissals.map((d) => `${d.normalizedName}::${d.type}`));
}

async function fetchPoolForSeeds(
  userId: string,
  workspaceId: IWorkspaceId,
  seeds: Array<Pick<IRawTransaction, "type" | "currency">>,
): Promise<IRawTransaction[]> {
  const pairKeys = new Set(seeds.map((seed) => `${seed.type}::${seed.currency}`));
  const pairs = [...pairKeys].map((pairKey) => {
    const [type, currency] = pairKey.split("::");
    return {
      type: type as "EXPENSE" | "INCOME",
      currency,
    };
  });

  if (pairs.length === 0) return [];

  return prisma.transaction.findMany({
    where: {
      userId,
      workspaceId,
      subscriptionId: null,
      OR: pairs,
    },
    select: TRANSACTION_SELECT,
    orderBy: { transactionDate: "asc" },
  }) as Promise<IRawTransaction[]>;
}

function buildTargetKeysFromSeeds(
  seeds: Array<Pick<IRawTransaction, "name" | "type" | "currency">>,
): Set<string> {
  return new Set(seeds.map((seed) => groupKey(seed)));
}

export class SubscriptionDetectionService {
  /**
   * Detect subscription candidates across unlinked transactions.
   *
   * Without a scope, scans the full workspace. With `transactionIds`, only
   * evaluates merchant groups touched by those transactions (still loading
   * full group history for frequency detection). With `from`/`to`, seeds
   * from transactions in that date range and applies the same group expansion.
   */
  static async detectSubscriptions(
    userId: string,
    workspaceId: IWorkspaceId,
    options?: IDetectSubscriptionsOptions,
  ): Promise<ISubscriptionCandidate[]> {
    const dismissedSet = await loadDismissedSet(userId, workspaceId);

    const transactionIds = options?.transactionIds;
    const hasDateRange = options?.from !== undefined && options?.to !== undefined;

    if (transactionIds && transactionIds.length > 0) {
      const seeds = await prisma.transaction.findMany({
        where: {
          id: { in: transactionIds },
          userId,
          workspaceId,
          subscriptionId: null,
        },
        select: TRANSACTION_SELECT,
      });

      if (seeds.length === 0) return [];

      const targetKeys = buildTargetKeysFromSeeds(seeds as IRawTransaction[]);
      const pool = await fetchPoolForSeeds(
        userId,
        workspaceId,
        seeds as IRawTransaction[],
      );

      return buildCandidatesFromGroups(
        groupTransactions(pool),
        dismissedSet,
        targetKeys,
      );
    }

    if (hasDateRange) {
      const from = options.from as string;
      const to = options.to as string;
      const seeds = await prisma.transaction.findMany({
        where: {
          userId,
          workspaceId,
          subscriptionId: null,
          transactionDate: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
        select: TRANSACTION_SELECT,
      });

      if (seeds.length === 0) return [];

      const targetKeys = buildTargetKeysFromSeeds(seeds as IRawTransaction[]);
      const pool = await fetchPoolForSeeds(
        userId,
        workspaceId,
        seeds as IRawTransaction[],
      );

      return buildCandidatesFromGroups(
        groupTransactions(pool),
        dismissedSet,
        targetKeys,
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        workspaceId,
        subscriptionId: null,
      },
      select: TRANSACTION_SELECT,
      orderBy: { transactionDate: "asc" },
    });

    return buildCandidatesFromGroups(
      groupTransactions(transactions as IRawTransaction[]),
      dismissedSet,
    );
  }

  static async detectForTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
  ): Promise<ISubscriptionCandidate[]> {
    return this.detectSubscriptions(userId, workspaceId, {
      transactionIds: [transactionId],
    });
  }
}
