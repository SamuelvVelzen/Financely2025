import { cn } from "@/features/util/cn";

/**
 * Props for the Wizard component
 */

/**
 * Props for the WizardProgress component
 */
export interface IWizardProgressProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether to show percentage */
  showPercentage?: boolean;
}


export function WizardProgress({
  currentStep,
  totalSteps,

}: IWizardProgressProps) {


  return (
    <div className="flex flex-col items-center gap-2">
      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              index < currentStep
                ? "bg-primary"
                : index === currentStep
                  ? "bg-primary w-8"
                  : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Step counter and percentage */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <span>
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
    </div>
  );
}
