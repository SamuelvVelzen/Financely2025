import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { WizardProgress } from "@/features/ui/wizard/wizard-progress";
import { useBlocker } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { HiArrowLeft } from "react-icons/hi2";
import type { IStepConfig, IStepNavigation } from "./multi-step-types";

type IMultiStepPageProps<StepType extends string> = {
  title: string;
  backAriaLabel: string;
  steps: Record<StepType, IStepConfig<StepType>>;
  stepOrder: readonly StepType[];
  initialStep: StepType;
  hasUnsavedChanges: boolean;
  onReset: () => void;
  onLeave: () => void;
  embedded?: boolean;
  dismissible?: boolean;
  onStepChange?: (previousStep: StepType, nextStep: StepType) => void;
};

export function MultiStepPage<StepType extends string>({
  title,
  backAriaLabel,
  steps,
  stepOrder,
  initialStep,
  hasUnsavedChanges,
  onReset,
  onLeave,
  embedded = false,
  dismissible = true,
  onStepChange,
}: IMultiStepPageProps<StepType>) {
  const [step, setStep] = useState<StepType>(initialStep);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const blocker = useBlocker({
    shouldBlockFn: () => !embedded && hasUnsavedChanges,
    withResolver: true,
    enableBeforeUnload: !embedded && hasUnsavedChanges,
  });

  const currentStepIndex = stepOrder.indexOf(step);
  const isFirstStep = currentStepIndex <= 0;
  const currentStepConfig = steps[step];

  const handleStepChange = useCallback(
    (nextStep: StepType) => {
      setStep((previousStep) => {
        if (previousStep !== nextStep) {
          onStepChange?.(previousStep, nextStep);
        }
        return nextStep;
      });
    },
    [onStepChange],
  );

  const navigation: IStepNavigation<StepType> = useMemo(
    () => ({
      currentStep: step,
      goToStep: handleStepChange,
    }),
    [step, handleStepChange],
  );

  const leave = useCallback(() => {
    onReset();
    onLeave();
  }, [onReset, onLeave]);

  const handleBack = useCallback(() => {
    if (!dismissible) {
      return;
    }
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    leave();
  }, [dismissible, hasUnsavedChanges, leave]);

  const showBlockerDialog = blocker.status === "blocked";
  const showUnsavedChangesPrompt = showUnsavedDialog || showBlockerDialog;

  const handleUnsavedDialogConfirm = useCallback(() => {
    if (showBlockerDialog && blocker.reset) {
      blocker.reset();
    }
    setShowUnsavedDialog(false);
    leave();
  }, [showBlockerDialog, blocker, leave]);

  const handleUnsavedDialogCancel = useCallback(() => {
    if (showBlockerDialog && blocker.reset) {
      blocker.reset();
    } else {
      setShowUnsavedDialog(false);
    }
  }, [showBlockerDialog, blocker]);

  if (!currentStepConfig) {
    return null;
  }

  const stepButtons = currentStepConfig.footerButtons(navigation) ?? [];
  const leftButton = isFirstStep
    ? {
        buttonContent: "Cancel",
        clicked: handleBack,
        disabled: !dismissible,
      }
    : stepButtons[0];
  const rightButtons = isFirstStep ? stepButtons : stepButtons.slice(1);

  return (
    <>
      <div
        className={embedded ? "flex flex-col" : "flex flex-col min-h-full"}>
        {!embedded && (
          <Container className="sticky top-0 z-10 bg-surface">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <IconButton
                  clicked={handleBack}
                  disabled={!dismissible}
                  ariaLabel={backAriaLabel}>
                  <HiArrowLeft className="size-4" />
                </IconButton>
                <Title>{title}</Title>
              </div>
              {currentStepConfig.headerActions}
            </div>
          </Container>
        )}

        <Container className={embedded ? "px-0" : undefined}>
          <div className="space-y-6">
            <div className="space-y-3">
              <WizardProgress
                currentStep={Math.max(currentStepIndex, 0)}
                totalSteps={stepOrder.length}
              />
              <div className="flex items-center justify-center gap-3">
                <Text
                  size="sm"
                  isMuted
                  className="text-center">
                  {currentStepConfig.title}
                </Text>
                {embedded ? currentStepConfig.headerActions : null}
              </div>
            </div>
            {currentStepConfig.content(navigation)}
          </div>
        </Container>

        <Container
          className={
            embedded
              ? "px-0 sticky bottom-0 bg-surface flex gap-2 justify-between mt-6 mb-0"
              : "sticky bottom-0 bg-surface flex gap-2 justify-between mt-auto mb-0"
          }>
          {leftButton ? <Button {...leftButton} /> : <div />}
          <div className="flex gap-2">
            {rightButtons.map((buttonProps, index) => (
              <Button
                key={index}
                {...buttonProps}
              />
            ))}
          </div>
        </Container>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedChangesPrompt}
        onConfirm={handleUnsavedDialogConfirm}
        onCancel={handleUnsavedDialogCancel}
      />
    </>
  );
}
