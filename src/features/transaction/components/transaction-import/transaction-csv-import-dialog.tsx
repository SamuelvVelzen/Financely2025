"use client";

import { MultiStepDialog } from "@/features/ui/dialog/multi-step-dialog";
import {
  IStep,
  TransactionImportProvider,
  useTransactionImportContext,
} from "./steps/transaction-import-context";
import { useConfirmStep } from "./steps/use-confirm-step";
import { useMappingStep } from "./steps/use-mapping-step";
import { useReviewStep } from "./steps/use-review-step";
import { useUploadStep } from "./steps/use-upload-step";

interface ICsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TransactionCsvImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ICsvImportDialogProps) {
  return (
    <TransactionImportProvider
      onSuccess={onSuccess}
      onClose={() => onOpenChange(false)}
    >
      <TransactionImportDialogContent open={open} onOpenChange={onOpenChange} />
    </TransactionImportProvider>
  );
}

interface IDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TransactionImportDialogContent({
  open,
  onOpenChange,
}: IDialogContentProps) {
  const ctx = useTransactionImportContext();

  // Each step is now a hook that returns IStepConfig
  const uploadStep = useUploadStep();
  const mappingStep = useMappingStep();
  const reviewStep = useReviewStep();
  const confirmStep = useConfirmStep();

  const steps: Record<IStep, typeof uploadStep> = {
    upload: uploadStep,
    mapping: mappingStep,
    review: reviewStep,
    confirm: confirmStep,
  };

  return (
    <MultiStepDialog
      steps={steps}
      initialStep="upload"
      open={open}
      onOpenChange={onOpenChange}
      hasUnsavedChanges={() => ctx.hasUnsavedChanges}
      onReset={ctx.resetAllState}
      dismissible={!ctx.isBusy}
      onStepChange={(_, nextStep) => {
        ctx.setCurrentStep(nextStep);
      }}
    />
  );
}
