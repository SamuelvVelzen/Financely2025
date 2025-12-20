import { ICreateTransactionInput } from "@/features/shared/validation/schemas";
import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { useToast } from "@/features/ui/toast";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

type IConfirmStepContentProps = {
  error: Error | null;
};

function ConfirmStepContent({ error }: IConfirmStepContentProps) {
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
      {error && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg">
          <p className="text-sm text-danger">
            {error.message || "Import failed"}
          </p>
        </div>
      )}
    </div>
  );
}

export function useConfirmStep(): IStepConfig<IStep> {
  const {
    importMutation,
    selectedRows,
    defaultCurrency,
    candidates,
    resetAllState,
    onClose,
  } = useTransactionImportContext();

  const toast = useToast();

  const handleConfirmImport = async () => {
    const transactionsToImport: ICreateTransactionInput[] = [];

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (
        !candidate ||
        !candidate.data.type ||
        !candidate.data.amount ||
        !candidate.data.occurredAt ||
        !candidate.data.name
      ) {
        continue;
      }

      const transaction: ICreateTransactionInput = {
        ...candidate.data,
        type: candidate.data.type,
        currency: candidate.data.currency || defaultCurrency || "EUR",
        amount: candidate.data.amount,
        occurredAt: candidate.data.occurredAt,
        name: candidate.data.name,
        tagIds: candidate.data.tagIds || [],
      };

      transactionsToImport.push(transaction);
    }

    try {
      await importMutation.mutateAsync(transactionsToImport);
      toast.success(
        `Successfully imported ${transactionsToImport.length} transactions`
      );
      resetAllState();
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import transactions");
    }
  };

  return {
    title: "Confirm Import",
    size: "lg",
    content: () => <ConfirmStepContent error={importMutation.error} />,
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => navigation.goToStep("review"),
        buttonContent: "Back",
      },
      {
        clicked: () => {
          if (!importMutation.isPending && selectedRows.size > 0) {
            handleConfirmImport();
          }
        },
        variant: "primary",
        disabled: importMutation.isPending || selectedRows.size === 0,
        buttonContent: importMutation.isPending
          ? "Importing..."
          : "Confirm Import",
      },
    ],
  };
}
