import type { ITransaction } from "@/features/shared/validation/schemas";

/** Amount shown in lists/tables after refund allocations. */
export function getTransactionDisplayAmount(
  transaction: ITransaction,
): string {
  if (transaction.type === "EXPENSE" && transaction.expenseNet != null) {
    return transaction.expenseNet;
  }
  if (transaction.type === "INCOME" && transaction.refundRemaining != null) {
    return transaction.refundRemaining;
  }
  return transaction.amount;
}

export function transactionHasRefundNetting(
  transaction: ITransaction,
): boolean {
  if (transaction.type === "EXPENSE" && transaction.expenseNet != null) {
    return transaction.expenseNet !== transaction.amount;
  }
  if (transaction.type === "INCOME" && transaction.refundRemaining != null) {
    return transaction.refundRemaining !== transaction.amount;
  }
  return false;
}
