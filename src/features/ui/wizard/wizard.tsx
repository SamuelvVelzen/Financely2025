import { type ReactNode, useCallback } from "react";
import { HiArrowLeft, HiArrowRight, HiCheck } from "react-icons/hi2";
import { Button } from "../button/button";
import { Container } from "../container/container";
import { WizardProgress } from "./wizard-progress";

export interface IWizardPage {
  /** Unique identifier for the page */
  id: string;
  /** Content to render for this page */
  content: ReactNode;
  /** Whether this page can be skipped. Defaults to true */
  skippable?: boolean;
}

export interface IWizardProps {
  /** Array of pages to display in the wizard */
  pages: IWizardPage[];
  /** Current step index (controlled) */
  currentStep: number;
  /** Callback when the step changes (required for navigation) */
  onStepChange: (stepIndex: number) => void;
  /** Callback when the wizard is completed */
  onComplete: () => void;
  /** Exit wizard without completing (e.g. back to list) */
  onCancel?: () => void;
  cancelLabel?: string;
  /** Block primary Next / Skip navigation */
  isNextDisabled?: boolean;
}

export function Wizard({
  pages,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  cancelLabel = "Exit",
  isNextDisabled = false,
}: IWizardProps) {
  const lastIndex = Math.max(pages.length - 1, 0);
  const stepIndex =
    pages.length === 0 ? 0 : Math.min(Math.max(currentStep, 0), lastIndex);
  const currentPage = pages[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === lastIndex;
  const canSkipCurrentPage = currentPage?.skippable ?? true;

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      onStepChange(stepIndex - 1);
    }
  }, [isFirstStep, stepIndex, onStepChange]);

  const handleNext = useCallback(() => {
    if (isNextDisabled) {
      return;
    }
    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(stepIndex + 1);
    }
  }, [isLastStep, isNextDisabled, stepIndex, onStepChange, onComplete]);

  if (!currentPage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <Container className="rounded-t-none">
        <WizardProgress
          currentStep={stepIndex}
          totalSteps={pages.length}
        />
      </Container>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div
          key={currentPage.id}
          className="max-w-3xl mx-auto">
          {currentPage.content}
        </div>
      </main>

      <Container
        className="rounded-b-none mb-0"
        as="footer">
        <div className="flex items-center justify-between container mx-auto">
          <div className="flex items-center gap-2">
            {onCancel ? (
              <Button
                clicked={onCancel}
                variant="default"
                size="md">
                {cancelLabel}
              </Button>
            ) : null}
            {!isFirstStep ? (
              <Button
                clicked={handleBack}
                variant="default"
                size="md"
                className="gap-2">
                <HiArrowLeft className="size-4" />
                Back
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {canSkipCurrentPage && !isLastStep && (
              <Button
                clicked={handleNext}
                variant="default"
                size="md"
                disabled={isNextDisabled}>
                Skip
              </Button>
            )}

            <Button
              clicked={handleNext}
              variant="primary"
              size="md"
              className="gap-2"
              disabled={isNextDisabled}>
              {isLastStep ? (
                <>
                  Complete
                  <HiCheck className="size-4" />
                </>
              ) : (
                <>
                  Next
                  <HiArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
