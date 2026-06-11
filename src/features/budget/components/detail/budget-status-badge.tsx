import { Badge } from "@/features/ui/badge/badge";
import type { IVariant } from "@/features/ui/button/button";
import { endOfMonth, parseISO } from "date-fns";

export type IBudgetCategoryType = "EXPENSE" | "INCOME";

export type IBudgetStatusParams = {
  percentage: number;
  categoryType?: IBudgetCategoryType;
  transactionCount?: number;
  isPeriodEnded?: boolean;
  expectedAmount?: number;
};

type IResolvedBudgetStatus = {
  label: string;
  variant?: IVariant;
  textColor: string;
  progressBarColor: string;
};

export function isBudgetViewPeriodEnded(
  budgetEndDate: string,
  monthlyBreakdown?: { year: number; month: number } | null,
): boolean {
  const now = new Date();

  if (monthlyBreakdown) {
    const periodEnd = endOfMonth(
      new Date(monthlyBreakdown.year, monthlyBreakdown.month - 1, 1),
    );
    return now > periodEnd;
  }

  const end = parseISO(budgetEndDate);
  end.setHours(23, 59, 59, 999);
  return now > end;
}

export function resolveBudgetStatus({
  percentage,
  categoryType = "EXPENSE",
  transactionCount,
  isPeriodEnded = false,
  expectedAmount = 0,
}: IBudgetStatusParams): IResolvedBudgetStatus {
  const hasNoActivity =
    transactionCount !== undefined && transactionCount === 0;

  if (hasNoActivity) {
    if (!isPeriodEnded || expectedAmount <= 0) {
      return {
        label: "No Activity",
        textColor: "text-text-muted",
        progressBarColor: "bg-transparent",
      };
    }

    if (categoryType === "INCOME") {
      return {
        label: "Below Target",
        variant: "warning",
        textColor: "text-warning",
        progressBarColor: "bg-warning",
      };
    }

    return {
      label: "Under Budget",
      variant: "success",
      textColor: "text-text-muted",
      progressBarColor: "bg-success",
    };
  }

  if (categoryType === "INCOME") {
    if (percentage > 100) {
      return {
        label: "Goal Exceeded",
        variant: "success",
        textColor: "text-success",
        progressBarColor: "bg-success",
      };
    }
    if (percentage >= 80) {
      return {
        label: "On Track",
        textColor: "text-text",
        progressBarColor: "bg-success",
      };
    }
    return {
      label: "Below Target",
      variant: "warning",
      textColor: "text-warning",
      progressBarColor: "bg-warning",
    };
  }

  if (percentage < 80) {
    return {
      label: "On Track",
      textColor: "text-text",
      progressBarColor: "bg-success",
    };
  }
  if (percentage <= 100) {
    return {
      label: "Near Limit",
      variant: "warning",
      textColor: "text-warning",
      progressBarColor: "bg-warning",
    };
  }
  return {
    label: "Over Budget",
    variant: "danger",
    textColor: "text-danger",
    progressBarColor: "bg-danger",
  };
}

type IBudgetStatusBadgeProps = IBudgetStatusParams;

export function BudgetStatusBadge(props: IBudgetStatusBadgeProps) {
  const status = resolveBudgetStatus(props);
  return <Badge variant={status.variant}>{status.label}</Badge>;
}

export const getStatusColor = (
  percentage: number,
  categoryType: IBudgetCategoryType = "EXPENSE",
  options?: Omit<IBudgetStatusParams, "percentage" | "categoryType">,
) =>
  resolveBudgetStatus({ percentage, categoryType, ...options }).textColor;

export const getProgressBarColor = (
  percentage: number,
  categoryType: IBudgetCategoryType = "EXPENSE",
  options?: Omit<IBudgetStatusParams, "percentage" | "categoryType">,
) =>
  resolveBudgetStatus({ percentage, categoryType, ...options }).progressBarColor;
