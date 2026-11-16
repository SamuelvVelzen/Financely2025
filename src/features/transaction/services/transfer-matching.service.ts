import type { ITransferSuggestion } from "@/features/shared/validation/schemas";
import { TransferSuggestionsResponseSchema } from "@/features/transaction/validation/schemas";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { TransactionType, TransferDirection } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

function oppositeDirection(
  direction: typeof TransferDirection.OUT | typeof TransferDirection.IN | null,
): typeof TransferDirection.OUT | typeof TransferDirection.IN {
  return direction === TransferDirection.IN
    ? TransferDirection.OUT
    : TransferDirection.IN;
}

function inferDirection(type: string, direction: string | null): string | null {
  if (type === TransactionType.TRANSFER) {
    return direction;
  }
  if (type === TransactionType.INCOME) {
    return TransferDirection.IN;
  }
  if (type === TransactionType.EXPENSE) {
    return TransferDirection.OUT;
  }
  return null;
}

function scoreCandidate(
  sourceName: string,
  targetName: string,
  sourceDescription: string | null,
  targetDescription: string | null,
): number {
  let score = 0;
  const haystack = `${targetName} ${targetDescription ?? ""}`.toLowerCase();
  const words = sourceName.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  for (const word of words) {
    if (haystack.includes(word)) score += 0.1;
  }
  if (/transfer|overboeking|atm|bargeld/i.test(haystack)) score += 0.25;
  return score;
}

export class TransferMatchingService {
  static async getSuggestionsForTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
  ) {
    const source = await prisma.transaction.findFirst({
      where: { id: transactionId, userId, workspaceId },
    });
    if (!source) {
      throw new Error("Transaction not found");
    }
    if (source.transferGroupId) {
      return TransferSuggestionsResponseSchema.parse({ suggestions: [] });
    }

    const sourceDir = inferDirection(source.type, source.transferDirection);
    if (!sourceDir) {
      return TransferSuggestionsResponseSchema.parse({ suggestions: [] });
    }

    const targetDir = oppositeDirection(
      sourceDir as typeof TransferDirection.OUT,
    );
    const amount = parseFloat(source.amount.toString());
    const from = new Date(source.transactionDate.getTime() - 3 * DAY_MS);
    const to = new Date(source.transactionDate.getTime() + 3 * DAY_MS);

    const candidates = await prisma.transaction.findMany({
      where: {
        userId,
        workspaceId,
        id: { not: transactionId },
        transferGroupId: null,
        currency: source.currency,
        transactionDate: { gte: from, lte: to },
        ...(source.ledgerAccountId
          ? { ledgerAccountId: { not: source.ledgerAccountId } }
          : {}),
      },
      take: 200,
    });

    const suggestions: ITransferSuggestion[] = [];
    for (const candidate of candidates) {
      const candDir = inferDirection(candidate.type, candidate.transferDirection);
      const candAmount = parseFloat(candidate.amount.toString());
      if (candAmount !== amount) continue;
      if (candDir !== targetDir && candDir !== null && sourceDir !== null) {
        continue;
      }

      suggestions.push({
        id: candidate.id,
        name: candidate.name,
        amount: candidate.amount.toString(),
        currency: candidate.currency,
        transactionDate: candidate.transactionDate.toISOString(),
        transferDirection: candidate.transferDirection,
        ledgerAccountId: candidate.ledgerAccountId,
        score:
          1 +
          scoreCandidate(
            source.name,
            candidate.name,
            source.description,
            candidate.description,
          ),
      });
    }

    suggestions.sort((a, b) => b.score - a.score);
    const topScore = suggestions[0]?.score;
    const filtered =
      topScore != null
        ? suggestions.filter((s) => s.score >= topScore - 0.05).slice(0, 5)
        : [];

    return TransferSuggestionsResponseSchema.parse({ suggestions: filtered });
  }

  static async findImportPairCandidates(
    userId: string,
    workspaceId: IWorkspaceId,
    importedIds: string[],
  ) {
    if (importedIds.length === 0) return [];
    const rows = await prisma.transaction.findMany({
      where: { id: { in: importedIds }, userId, workspaceId },
    });

    const pairs: Array<{ aId: string; bId: string; score: number }> = [];
    const used = new Set<string>();

    for (const source of rows) {
      if (used.has(source.id) || source.transferGroupId) continue;
      const sourceDir = inferDirection(source.type, source.transferDirection);
      if (!sourceDir) continue;

      const amount = parseFloat(source.amount.toString());
      const from = new Date(source.transactionDate.getTime() - 3 * DAY_MS);
      const to = new Date(source.transactionDate.getTime() + 3 * DAY_MS);

      const match = rows.find((candidate) => {
        if (candidate.id === source.id || used.has(candidate.id)) return false;
        if (candidate.currency !== source.currency) return false;
        const candAmount = parseFloat(candidate.amount.toString());
        if (candAmount !== amount) return false;
        const within =
          candidate.transactionDate >= from && candidate.transactionDate <= to;
        if (!within) return false;
        const candDir = inferDirection(candidate.type, candidate.transferDirection);
        return candDir === oppositeDirection(sourceDir as typeof TransferDirection.OUT);
      });

      if (match) {
        pairs.push({ aId: source.id, bId: match.id, score: 2 });
        used.add(source.id);
        used.add(match.id);
      }
    }

    return pairs;
  }
}
