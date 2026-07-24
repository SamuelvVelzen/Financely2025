import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/features/util/cn";
import { HiMinus, HiPlus } from "react-icons/hi2";

function parseShareCount(value: string): number {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed);
}

export function SplitExpenseShareStepper({
  value,
  disabled,
  onChange,
  ariaLabel,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const count = parseShareCount(value);

  return (
    <div
      className="flex items-center gap-1 shrink-0"
      aria-label={ariaLabel}>
      <IconButton
        size="sm"
        variant="default"
        ariaLabel={`Decrease ${ariaLabel}`}
        disabled={disabled || count <= 0}
        clicked={() => onChange(String(Math.max(0, count - 1)))}>
        <HiMinus className="size-3.5" />
      </IconButton>
      <span
        className={cn(
          "w-8 text-center text-sm tabular-nums font-medium",
          disabled ? "text-text-muted" : "text-text",
        )}>
        {count}
      </span>
      <IconButton
        size="sm"
        variant="default"
        ariaLabel={`Increase ${ariaLabel}`}
        disabled={disabled}
        clicked={() => onChange(String(count + 1))}>
        <HiPlus className="size-3.5" />
      </IconButton>
    </div>
  );
}
