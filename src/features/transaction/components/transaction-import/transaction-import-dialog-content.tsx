import { MultiStepDialog } from "@/features/ui/dialog/multi-step-dialog";
import {
  type IStep,
  useTransactionImportContext,
} from "./steps/transaction-import-context";
import { useConfirmStep } from "./steps/use-confirm-step";
import { useMappingStep } from "./steps/use-mapping-step";
import { useReviewStep } from "./steps/use-review-step";
import { useUploadStep } from "./steps/use-upload-step";

type ITransactionImportDialogContentProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TransactionImportDialogContent({
  open,
  onOpenChange,
}: ITransactionImportDialogContentProps) {
  const ctx = useTransactionImportContext();

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
