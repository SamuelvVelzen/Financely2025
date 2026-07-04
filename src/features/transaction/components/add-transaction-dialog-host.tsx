import { AddOrEditTransactionDialog } from "@/features/transaction/components/add-or-edit-transaction-dialog";

type IAddTransactionDialogHostProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddTransactionDialogHost({
  open,
  onOpenChange,
}: IAddTransactionDialogHostProps) {
  return (
    <AddOrEditTransactionDialog
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
