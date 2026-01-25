import { cn } from "@/features/util/cn";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { HiArrowLeft, HiArrowRight, HiCheck } from "react-icons/hi";
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
}

export function Wizard({
  pages,
  currentStep,
  onStepChange,
  onComplete,
}: IWizardProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedStep, setDisplayedStep] = useState(currentStep);

  // Sync displayed step with current step (with transition)
  useEffect(() => {
    if (currentStep !== displayedStep) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedStep(currentStep);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStep, displayedStep]);

  const currentPage = pages[displayedStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === pages.length - 1;
  const canSkipCurrentPage = currentPage?.skippable !== false;

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  }, [isFirstStep, currentStep, onStepChange]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  }, [isLastStep, currentStep, onStepChange, onComplete]);

  if (!currentPage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">

      {/* Progress indicator */}
      <Container className="rounded-t-none">
        <WizardProgress
          currentStep={currentStep}
          totalSteps={pages.length}
        />
      </Container>

      {/* Content area */}
      <main
        className={cn(
          "flex-1 overflow-y-auto p-6 md:p-12",
          "transition-opacity duration-150",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}>
        <div className="max-w-3xl mx-auto">{currentPage.content}</div>
      </main>

      {/* Footer with navigation */}
      <Container className="rounded-b-none mb-0" as="footer">
        <div className="flex items-center justify-between container mx-auto">
          {/* Back button in footer */}
          {!isFirstStep ? (
            <Button
              clicked={handleBack}
              variant="default"
              size="md"
              className="gap-2">
              <HiArrowLeft className="size-4" />
              Back
            </Button>
          ) : (
            <div />
          )}


          <div className="flex items-center gap-3">
            {/* Skip current page button (only for skippable pages, not on last step) */}
            {canSkipCurrentPage && !isLastStep && (
              <Button
                clicked={handleNext}
                variant="default"
                size="md">
                Skip
              </Button>
            )}

            {/* Next/Complete button */}
            <Button
              clicked={handleNext}
              variant="primary"
              size="md"
              className="gap-2">
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
