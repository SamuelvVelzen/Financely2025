import {
  FREQUENCY_DAY_RANGES,
  SUBSCRIPTION_FREQUENCIES,
  type ISubscriptionFrequency,
} from "@/features/subscription/config/frequencies";
import type { ISubscriptionCandidate } from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";

type IRawTransaction = {
  id: string;
  name: string;
  amount: { toNumber: () => number; toString: () => string };
  currency: string;
  transactionDate: Date;
  type: "EXPENSE" | "INCOME";
};

/**
 * Normalize a transaction name for grouping.
 * Strips trailing dates, reference numbers, and whitespace differences.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/g, "") // dates like 01/15/2025
    .replace(/\b\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}\b/g, "") // dates like 2025-01-15
    .replace(/\s*#\s*\d+/g, "") // reference numbers like #12345
    .replace(/\s*ref\s*:?\s*\d+/gi, "") // ref: 12345
    .replace(/\s+$/, "")
    .trim();
}

/**
 * Check if a set of amounts are consistent (within tolerance).
 */
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

/**
 * Detect the recurrence frequency from a sorted list of dates.
 * Returns the best matching frequency or null if no pattern found.
 */
function detectFrequency(
  dates: Date[],
): ISubscriptionFrequency | null {
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

export class SubscriptionDetectionService {
  /**
   * Detect potential subscriptions from a user's transactions.
   * Groups by normalized name + type + currency, checks amount consistency and recurrence.
   */
  static async detectSubscriptions(
    userId: string,
  ): Promise<ISubscriptionCandidate[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        subscriptionId: null,
      },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        transactionDate: true,
        type: true,
      },
      orderBy: { transactionDate: "asc" },
    });

    const dismissals = await prisma.subscriptionDismissal.findMany({
      where: { userId },
      select: { normalizedName: true, type: true },
    });

    const dismissedSet = new Set(
      dismissals.map((d) => `${d.normalizedName}::${d.type}`),
    );

    const groups = new Map<string, IRawTransaction[]>();

    for (const tx of transactions) {
      const normalized = normalizeName(tx.name);
      const key = `${normalized}::${tx.type}::${tx.currency}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(tx as IRawTransaction);
    }

    const candidates: ISubscriptionCandidate[] = [];

    for (const [key, txns] of groups) {
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

  /**
   * Check a single newly created transaction against existing ones
   * to detect if it forms a subscription pattern.
   * Returns candidates that include the new transaction.
   */
  static async detectForTransaction(
    userId: string,
    transactionId: string,
  ): Promise<ISubscriptionCandidate[]> {
    const newTx = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        transactionDate: true,
        type: true,
      },
    });

    if (!newTx) return [];

    const normalized = normalizeName(newTx.name);

    const dismissals = await prisma.subscriptionDismissal.findFirst({
      where: { userId, normalizedName: normalized, type: newTx.type },
    });
    if (dismissals) return [];

    const similarTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: newTx.type,
        currency: newTx.currency,
        subscriptionId: null,
        id: { not: transactionId },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        transactionDate: true,
        type: true,
      },
      orderBy: { transactionDate: "asc" },
    });

    const matchingTxns: IRawTransaction[] = [newTx as IRawTransaction];

    for (const tx of similarTransactions) {
      if (normalizeName(tx.name) === normalized) {
        matchingTxns.push(tx as IRawTransaction);
      }
    }

    if (matchingTxns.length < 2) return [];

    const amounts = matchingTxns.map((t) => t.amount.toNumber());
    if (!areAmountsConsistent(amounts)) return [];

    const sortedTxns = matchingTxns.sort(
      (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
    );
    const sortedDates = sortedTxns.map((t) => t.transactionDate);

    const frequency = detectFrequency(sortedDates);
    if (!frequency) return [];

    const avgAmount =
      amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

    return [
      {
        normalizedName: normalized,
        displayName: newTx.name,
        type: newTx.type as "EXPENSE" | "INCOME",
        averageAmount: avgAmount.toFixed(2),
        currency: newTx.currency,
        frequency,
        occurrences: sortedTxns.length,
        transactionIds: sortedTxns.map((t) => t.id),
        firstDate: sortedDates[0].toISOString(),
        lastDate: sortedDates[sortedDates.length - 1].toISOString(),
      },
    ];
  }
}
