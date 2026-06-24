import { useTransactionImportContext } from "./transaction-import-context";

type IConfirmStepContentProps = {
  error: Error | null;
};

export function ConfirmStepContent({ error }: IConfirmStepContentProps) {
  const { selectedRows, candidates } = useTransactionImportContext();

  const selectedCount = selectedRows.size;
  const totalCount = candidates.length;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-surface-hover rounded-2xl">
        <p className="text-sm font-medium mb-2">Import Summary</p>
        <p className="text-sm">
          You are about to import <strong>{selectedCount}</strong> of{" "}
          <strong>{totalCount}</strong> transactions.
        </p>
      </div>
      {error && (
        <div className="p-3 bg-danger/10 border border-danger rounded-2xl">
          <p className="text-sm text-danger">
            {error.message || "Import failed"}
          </p>
        </div>
      )}
    </div>
  );
}
