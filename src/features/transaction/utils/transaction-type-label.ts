import type { ITransaction } from "@/features/shared/validation/schemas";

export function getTransactionTypeLabel(
  transaction: Pick<ITransaction, "type">,
): string {
  if (transaction.type === "EXPENSE") return "Expense";
  if (transaction.type === "INCOME") return "Income";
  return "Transfer";
}
