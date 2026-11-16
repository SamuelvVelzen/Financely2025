import type { ITransactionType } from "@/features/shared/validation/schemas";

/** Transaction types allowed on budget tags (not TRANSFER). */
export type ITagTransactionType = "EXPENSE" | "INCOME";

export function toTagTransactionType(
  type: ITransactionType | undefined,
  fallback: ITagTransactionType = "EXPENSE",
): ITagTransactionType {
  if (type === "INCOME") return "INCOME";
  if (type === "EXPENSE") return "EXPENSE";
  return fallback;
}

export function isTagTransactionType(
  type: ITransactionType,
): type is ITagTransactionType {
  return type === "EXPENSE" || type === "INCOME";
}