import type { ITransaction } from "@/features/shared/validation/schemas";
import { Badge } from "@/features/ui/badge/badge";
import {
  getTransactionRefundBadgeKind,
  getTransactionRefundBadgeLabel,
} from "@/features/transaction/utils/get-transaction-refund-badge";
import { HiArrowUturnLeft } from "react-icons/hi2";

type ITransactionRefundBadgeProps = {
  transaction: ITransaction;
};

export function TransactionRefundBadge({
  transaction,
}: ITransactionRefundBadgeProps) {
  const kind = getTransactionRefundBadgeKind(transaction);
  if (!kind) {
    return null;
  }

  const label = getTransactionRefundBadgeLabel(kind);
  const variant =
    kind === "refunded" || kind === "allocated" ? "success" : "info";

  return (
    <Badge
      variant={variant}
      tooltip={label}>
      <HiArrowUturnLeft className="size-3" />
      <span className="sr-only">{label}</span>
    </Badge>
  );
}
