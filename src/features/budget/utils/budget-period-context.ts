import type {
  IBudget,
  IBudgetMonthlyBreakdown,
} from "@/features/shared/validation/schemas";
import { formatDateRange } from "@/features/util/date/date-helpers";

export function formatBudgetMonthLabel(
  year: number,
  month: number,
  monthLabels: readonly string[],
): string {
  return `${monthLabels[month - 1]} ${year}`;
}

export function getBudgetPeriodViewLabel(
  budget: Pick<IBudget, "startDate" | "endDate">,
  options: {
    selectedBreakdown: IBudgetMonthlyBreakdown | null;
    monthCount: number;
    monthLabels: readonly string[];
  },
): string {
  const budgetRange = formatDateRange(budget.startDate, budget.endDate);

  if (options.selectedBreakdown) {
    const { year, month } = options.selectedBreakdown;
    const monthName = formatBudgetMonthLabel(
      year,
      month,
      options.monthLabels,
    );
    return `${monthName} · monthly figures`;
  }

  if (options.monthCount <= 1) {
    return budgetRange;
  }

  return `${budgetRange} · all ${options.monthCount} months combined`;
}
