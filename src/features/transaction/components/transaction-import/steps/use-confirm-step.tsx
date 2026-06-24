import { type ICreateTransactionInput } from "@/features/shared/validation/schemas";
import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { useToast } from "@/features/ui/toast";
import { ConfirmStepContent } from "./confirm-step-content";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

export function useConfirmStep(): IStepConfig<IStep> {
  const {
    importMutation,
    selectedRows,
    defaultCurrency,
    candidates,
    resetAllState,
    onCloseSuccessful,
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
        !candidate.data.transactionDate ||
        !candidate.data.name
      ) {
        continue;
      }

      const transaction: ICreateTransactionInput = {
        ...candidate.data,
        type: candidate.data.type,
        currency: candidate.data.currency || defaultCurrency || "EUR",
        amount: candidate.data.amount,
        transactionDate: candidate.data.transactionDate,
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
      onCloseSuccessful();
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
        loading: {
          isLoading: importMutation.isPending,
          text: "Importing transactions",
        },
        buttonContent: "Confirm Import",
      },
    ],
  };
}
