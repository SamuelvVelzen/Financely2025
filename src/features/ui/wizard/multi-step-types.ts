import type { IButtonProps } from "@/features/ui/button/button";
import type { IDialogSize } from "@/features/ui/dialog/dialog/types";
import type { ReactNode } from "react";

export interface IStepNavigation<StepType extends string> {
  currentStep: StepType;
  goToStep: (step: StepType) => void;
}

export interface IStepConfig<StepType extends string> {
  title: string;
  /** Dialog-only; ignored when rendering as a page. */
  size?: IDialogSize;
  headerActions?: ReactNode;
  content: (navigation: IStepNavigation<StepType>) => ReactNode;
  footerButtons: (
    navigation: IStepNavigation<StepType>,
  ) => IButtonProps[] | undefined;
}
