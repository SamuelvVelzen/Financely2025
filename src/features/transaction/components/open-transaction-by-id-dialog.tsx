import { AddOrEditTransactionDialog } from "@/features/transaction/components/add-or-edit-transaction-dialog";
import { useTransaction } from "@/features/transaction/hooks/useTransactions";

type IOpenTransactionByIdDialogProps = {
  transactionId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function OpenTransactionByIdDialog({
  transactionId,
  onOpenChange,
  onSuccess,
}: IOpenTransactionByIdDialogProps) {
  const transactionQuery = useTransaction(transactionId);
  const transaction = transactionQuery.data ?? undefined;

  if (transactionId == null || transaction == null) {
    return null;
  }

  return (
    <AddOrEditTransactionDialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onOpenChange(false);
        }
      }}
      transaction={transaction}
      onSuccess={onSuccess}
    />
  );
}
