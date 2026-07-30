import type { ITransaction } from "@/features/shared/validation/schemas";

export type ITransactionRefundBadgeKind =
  | "refunded"
  | "partially_refunded"
  | "allocated"
  | "partially_allocated"
  | null;

export function getTransactionRefundBadgeKind(
  transaction: ITransaction,
): ITransactionRefundBadgeKind {
  if (transaction.type === "EXPENSE") {
    const net = parseFloat(transaction.expenseNet ?? transaction.amount);
    const amount = parseFloat(transaction.amount);
    if (!(amount > 0) || net >= amount) {
      return null;
    }
    if (net <= 0) {
      return "refunded";
    }
    return "partially_refunded";
  }

  if (transaction.type === "INCOME") {
    const hasAllocations = (transaction.refundAllocations?.length ?? 0) > 0;
    if (!hasAllocations) {
      return null;
    }
    const remaining = parseFloat(
      transaction.refundRemaining ?? transaction.amount,
    );
    if (remaining <= 0) {
      return "allocated";
    }
    return "partially_allocated";
  }

  return null;
}

export function getTransactionRefundBadgeLabel(
  kind: Exclude<ITransactionRefundBadgeKind, null>,
): string {
  switch (kind) {
    case "refunded":
      return "Refunded";
    case "partially_refunded":
      return "Partially refunded";
    case "allocated":
      return "Allocated";
    case "partially_allocated":
      return "Partially allocated";
  }
}
