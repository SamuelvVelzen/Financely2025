import type { ICsvCandidateTransaction } from "@/features/shared/validation/schemas";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ICsvTransferPairSuggestion = {
  outRowIndex: number;
  inRowIndex: number;
  score: number;
  label: string;
};

function inferDirection(
  type: string,
  transferDirection: string | null | undefined,
): "OUT" | "IN" | null {
  if (type === "TRANSFER") {
    if (transferDirection === "OUT" || transferDirection === "IN") {
      return transferDirection;
    }
    return null;
  }
  if (type === "EXPENSE") return "OUT";
  if (type === "INCOME") return "IN";
  return null;
}

function isPairable(candidate: ICsvCandidateTransaction): boolean {
  if (candidate.status === "invalid") return false;
  const { amount, currency, transactionDate, name } = candidate.data;
  return Boolean(
    amount && currency && transactionDate && name?.trim() && candidate.data.type,
  );
}

export function findCsvTransferPairSuggestions(
  candidates: ICsvCandidateTransaction[],
): ICsvTransferPairSuggestion[] {
  const pairable = candidates.filter(isPairable);
  const used = new Set<number>();
  const suggestions: ICsvTransferPairSuggestion[] = [];

  for (const source of pairable) {
    if (used.has(source.rowIndex) || source.data.transferGroupId) continue;

    const sourceDir = inferDirection(
      source.data.type,
      source.data.transferDirection,
    );
    if (!sourceDir) continue;

    const amount = parseFloat(source.data.amount);
    if (!Number.isFinite(amount)) continue;

    const sourceDate = new Date(source.data.transactionDate);
    const from = sourceDate.getTime() - 3 * DAY_MS;
    const to = sourceDate.getTime() + 3 * DAY_MS;
    const targetDir = sourceDir === "OUT" ? "IN" : "OUT";

    const match = pairable.find((candidate) => {
      if (candidate.rowIndex === source.rowIndex) return false;
      if (used.has(candidate.rowIndex) || candidate.data.transferGroupId) {
        return false;
      }
      if (candidate.data.currency !== source.data.currency) return false;
      const candAmount = parseFloat(candidate.data.amount);
      if (candAmount !== amount) return false;
      const candDate = new Date(candidate.data.transactionDate).getTime();
      if (candDate < from || candDate > to) return false;
      const candDir = inferDirection(
        candidate.data.type,
        candidate.data.transferDirection,
      );
      return candDir === targetDir;
    });

    if (match) {
      const outRow =
        sourceDir === "OUT" ? source.rowIndex : match.rowIndex;
      const inRow =
        sourceDir === "IN" ? source.rowIndex : match.rowIndex;
      const outName =
        sourceDir === "OUT" ? source.data.name : match.data.name;
      const inName =
        sourceDir === "IN" ? source.data.name : match.data.name;
      suggestions.push({
        outRowIndex: outRow,
        inRowIndex: inRow,
        score: 2,
        label: `${outName} ↔ ${inName} · ${source.data.amount} ${source.data.currency}`,
      });
      used.add(source.rowIndex);
      used.add(match.rowIndex);
    }
  }

  return suggestions;
}

export function applyCsvTransferPair(
  outCandidate: ICsvCandidateTransaction,
  inCandidate: ICsvCandidateTransaction,
  transferGroupId: string,
): {
  out: Partial<ICsvCandidateTransaction["data"]>;
  in: Partial<ICsvCandidateTransaction["data"]>;
} {
  const baseName = `${outCandidate.data.name} → ${inCandidate.data.name}`;
  return {
    out: {
      type: "TRANSFER",
      transferDirection: "OUT",
      transferGroupId,
      name: baseName,
      paymentMethod: "BANK_TRANSFER",
      tagIds: [],
      primaryTagId: null,
    },
    in: {
      type: "TRANSFER",
      transferDirection: "IN",
      transferGroupId,
      name: baseName,
      paymentMethod: "BANK_TRANSFER",
      tagIds: [],
      primaryTagId: null,
    },
  };
}