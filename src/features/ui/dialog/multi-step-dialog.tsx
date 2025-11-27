"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./dialog/dialog";
import type { IDialogProps } from "./dialog/types";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

export interface IStepNavigation<StepType extends string> {
  currentStep: StepType;
  goToStep: (step: StepType) => void;
}

export interface IStepConfig<StepType extends string> {
  title: string;
  size: IDialogProps["size"];
  content: (navigation: IStepNavigation<StepType>) => React.ReactNode;
  footerButtons: (
    navigation: IStepNavigation<StepType>
  ) => IDialogProps["footerButtons"];
}

export interface IMultiStepDialogProps<StepType extends string> {
  /** Step configurations */
  steps: Record<StepType, IStepConfig<StepType>>;
  /** Initial step when dialog opens */
  initialStep: StepType;
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback to check if there are unsaved changes */
  hasUnsavedChanges: () => boolean;
  /** Callback to reset state when dialog closes */
  onReset: () => void;
  /** Whether dialog is busy (disables dismissal) */
  isBusy?: boolean;
}

export function MultiStepDialog<StepType extends string>({
  steps,
  initialStep,
  open,
  onOpenChange,
  hasUnsavedChanges,
  onReset,
  isBusy = false,
}: IMultiStepDialogProps<StepType>) {
  const [step, setStep] = useState<StepType>(initialStep);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep(initialStep);
    }
  }, [open, initialStep]);

  // Close unsaved dialog when main dialog closes
  useEffect(() => {
    if (!open) {
      setShowUnsavedDialog(false);
    }
  }, [open]);

  const handleDialogClose = () => {
    onReset();
    onOpenChange(false);
  };

  const handleAttemptClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
      return;
    }
    handleDialogClose();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    handleAttemptClose();
  };

  const currentStepConfig = steps[step];
  if (!currentStepConfig) {
    console.error(`Step "${step}" not found in steps configuration`);
    return null;
  }

  const navigation: IStepNavigation<StepType> = {
    currentStep: step,
    goToStep: setStep,
  };

  return (
    <>
      <Dialog
        title={currentStepConfig.title}
        content={currentStepConfig.content(navigation)}
        footerButtons={currentStepConfig.footerButtons(navigation)}
        open={open}
        onOpenChange={handleDialogOpenChange}
        variant="modal"
        size={currentStepConfig.size}
        dismissible={!isBusy}
        onClose={onReset}
      />
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          handleDialogClose();
        }}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}
