import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

function ConfirmStepContent() {
  const { selectedRows, candidates, importMutation } =
    useTransactionImportContext();

  const selectedCount = selectedRows.size;
  const totalCount = candidates.length;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-surface-hover rounded-lg">
        <p className="text-sm font-medium mb-2">Import Summary</p>
        <p className="text-sm">
          You are about to import <strong>{selectedCount}</strong> of{" "}
          <strong>{totalCount}</strong> transactions.
        </p>
      </div>
      {importMutation.isError && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg">
          <p className="text-sm text-danger">
            {importMutation.error?.message || "Import failed"}
          </p>
        </div>
      )}
    </div>
  );
}

export function useConfirmStep(): IStepConfig<IStep> {
  const ctx = useTransactionImportContext();

  return {
    title: "Confirm Import",
    size: "lg",
    content: () => <ConfirmStepContent />,
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => navigation.goToStep("review"),
        buttonContent: "Back",
      },
      {
        clicked: () => {
          if (!ctx.importMutation.isPending && ctx.selectedRows.size > 0) {
            ctx.handleConfirmImport();
          }
        },
        variant: "primary",
        disabled: ctx.importMutation.isPending || ctx.selectedRows.size === 0,
        buttonContent: ctx.importMutation.isPending
          ? "Importing..."
          : "Confirm Import",
      },
    ],
  };
}

