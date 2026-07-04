import { TransactionImportProvider } from "./steps/transaction-import-provider";
import { TransactionImportDialogContent } from "./transaction-import-dialog-content";

interface ICsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionCsvImportDialog({
  open,
  onOpenChange,
}: ICsvImportDialogProps) {
  return (
    <TransactionImportProvider onClose={() => onOpenChange(false)}>
      <TransactionImportDialogContent
        open={open}
        onOpenChange={onOpenChange}
      />
    </TransactionImportProvider>
  );
}
