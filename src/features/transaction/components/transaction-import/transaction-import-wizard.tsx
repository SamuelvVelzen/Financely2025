import { MultiStepPage } from "@/features/ui/wizard/multi-step-page";
import { useConfirmStep } from "./steps/use-confirm-step";
import { useMappingStep } from "./steps/use-mapping-step";
import { useReviewStep } from "./steps/use-review-step";
import { useUploadStep } from "./steps/use-upload-step";
import {
  type IStep,
  useTransactionImportContext,
} from "./steps/transaction-import-context";

const STEP_ORDER = ["upload", "mapping", "review", "confirm"] as const;

type ITransactionImportWizardProps = {
  embedded?: boolean;
  onLeave: () => void;
};

export function TransactionImportWizard({
  embedded = false,
  onLeave,
}: ITransactionImportWizardProps) {
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
    <MultiStepPage
      title="Import transactions"
      backAriaLabel="Back to transactions"
      steps={steps}
      stepOrder={STEP_ORDER}
      initialStep="upload"
      embedded={embedded}
      hasUnsavedChanges={ctx.hasUnsavedChanges}
      dismissible={!ctx.isBusy}
      onReset={ctx.resetAllState}
      onLeave={onLeave}
      onStepChange={(_, nextStep) => {
        ctx.setCurrentStep(nextStep);
      }}
    />
  );
}
