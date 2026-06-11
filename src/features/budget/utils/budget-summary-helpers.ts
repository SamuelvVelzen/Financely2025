import type { IBudgetComparison } from "@/features/shared/validation/schemas";
import type { IVariant } from "@/features/ui/button/button";

export function getNetRemainingFromTotals(
  totals: IBudgetComparison["totals"],
) {
  const incomeExpected = parseFloat(totals.income.expected);
  const incomeActual = parseFloat(totals.income.actual);
  const expenseExpected = parseFloat(totals.expenses.expected);
  const expenseActual = parseFloat(totals.expenses.actual);

  return {
    actualRemaining: incomeActual - expenseActual,
    expectedRemaining: incomeExpected - expenseExpected,
  };
}

export function getNetRemainingStatus(
  actualRemaining: number,
  expectedRemaining: number,
) {
  if (actualRemaining < 0) {
    return {
      label: "Deficit",
      variant: "danger" as const,
      colorClass: "text-danger",
    };
  }

  if (expectedRemaining > 0 && actualRemaining < expectedRemaining * 0.8) {
    return {
      label: "Below Target",
      variant: "warning" as const,
      colorClass: "text-warning",
    };
  }

  if (expectedRemaining > 0 && actualRemaining >= expectedRemaining) {
    return {
      label: "On Track",
      variant: "success" as const,
      colorClass: "text-success",
    };
  }

  return {
    label: "On Track",
    variant: undefined,
    colorClass: "text-text",
  };
}

export type INetRemainingStatus = {
  label: string;
  variant?: IVariant;
  colorClass: string;
};
