import {
  type IStepConfig,
  type IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { useState } from "react";
import { ReviewStepContent } from "./review-step-content";
import {
  type IStep,
  useTransactionImportContext,
} from "./transaction-import-context";

export function useReviewStep(): IStepConfig<IStep> {
  const ctx = useTransactionImportContext();

  const [errorDialogRowIndex, setErrorDialogRowIndex] = useState<number | null>(
    null
  );

  return {
    title: "Review Transactions",
    size: "full",
    content: () => (
      <ReviewStepContent
        errorDialogRowIndex={errorDialogRowIndex}
        setErrorDialogRowIndex={setErrorDialogRowIndex}
      />
    ),
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => navigation.goToStep("mapping"),
        buttonContent: "Back",
      },
      {
        clicked: () => {
          if (ctx.selectedRows.size > 0) {
            navigation.goToStep("confirm");
          }
        },
        variant: "primary",
        disabled: ctx.selectedRows.size === 0,
        buttonContent: `Continue to import ${ctx.selectedRows.size} transaction${ctx.selectedRows.size !== 1 ? "s" : ""}`,
      },
    ],
  };
}
