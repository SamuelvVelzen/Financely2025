import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type { IBudgetComparison } from "@/features/shared/validation/schemas";
import { cn } from "@/features/util/cn";

type ISummaryMetricProps = {
  label: string;
  actual: string;
  expected: string;
  currency: IBudgetComparison["budget"]["currency"];
  valueClassName?: string;
  align?: "left" | "center" | "right";
  size?: "md" | "lg" | "xl";
};

export function SummaryMetric({
  label,
  actual,
  expected,
  currency,
  valueClassName,
  align = "left",
  size = "md",
}: ISummaryMetricProps) {
  return (
    <div
      className={cn(
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}>
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div
        className={cn(
          "font-semibold",
          size === "xl"
            ? "text-3xl"
            : size === "lg"
              ? "text-2xl"
              : "text-xl",
          valueClassName,
        )}>
        {formatCurrency(actual, currency)}
      </div>
      <div className="text-xs text-text-muted">
        of {formatCurrency(expected, currency)}
      </div>
    </div>
  );
}
