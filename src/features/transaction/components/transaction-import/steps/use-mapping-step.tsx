import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { MappingStepContent } from "./mapping-step-content";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

export function useMappingStep(): IStepConfig<IStep> {
  const ctx = useTransactionImportContext();

  return {
    title: "Map Fields",
    size: "3/4",
    content: () => <MappingStepContent />,
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => navigation.goToStep("upload"),
        buttonContent: "Back",
      },
      {
        clicked: () => {
          ctx.mappingForm.handleSubmit(() => {
            ctx.handleValidateMapping(navigation.goToStep);
          })();
        },
        variant: "primary",
        disabled: ctx.transformMutation.isPending,
        loading: {
          isLoading: ctx.transformMutation.isPending,
          text: "Processing transactions",
        },
        buttonContent: "Continue",
      },
    ],
  };
}
