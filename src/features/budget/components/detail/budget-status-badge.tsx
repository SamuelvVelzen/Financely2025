import { Tooltip } from "@/features/ui/tooltip/tooltip";
import { cn } from "@/features/util/cn";
import { endOfMonth, parseISO } from "date-fns";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";

export type IBudgetCategoryType = "EXPENSE" | "INCOME";

export type IBudgetStatusParams = {
  percentage: number;
  categoryType?: IBudgetCategoryType;
  transactionCount?: number;
  isPeriodEnded?: boolean;
  expectedAmount?: number;
};

type IStatusIcon = "up" | "down" | null;

type IResolvedBudgetStatus = {
  label: string;
  textColor: string;
  icon: IStatusIcon;
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
        icon: null,
      };
    }

    if (categoryType === "INCOME") {
      return {
        label: "Below Target",
        textColor: "text-warning",
        icon: "down",
      };
    }

    return {
      label: "Under Budget",
      textColor: "text-text-muted",
      icon: null,
    };
  }

  if (categoryType === "INCOME") {
    if (percentage > 100) {
      return {
        label: "Exceeded",
        textColor: "text-success",
        icon: "up",
      };
    }
    if (percentage >= 80) {
      return {
        label: "On Track",
        textColor: "text-text",
        icon: null,
      };
    }
    return {
      label: "Below Target",
      textColor: "text-warning",
      icon: "down",
    };
  }

  if (percentage < 80) {
    return {
      label: "On Track",
      textColor: "text-text",
      icon: null,
    };
  }
  if (percentage <= 100) {
    return {
      label: "Near Limit",
      textColor: "text-warning",
      icon: "up",
    };
  }
  return {
    label: "Over Budget",
    textColor: "text-danger",
    icon: "up",
  };
}

export function BudgetStatusIcon(props: IBudgetStatusParams) {
  const status = resolveBudgetStatus(props);

  if (!status.icon) {
    return <span className="size-5 shrink-0" aria-hidden />;
  }

  const Icon = status.icon === "up" ? HiChevronUp : HiChevronDown;

  return (
    <Tooltip content={status.label}>
      <span
        className="inline-flex shrink-0"
        role="img"
        aria-label={status.label}>
        <Icon className={cn("size-5", status.textColor)} />
      </span>
    </Tooltip>
  );
}

export const getStatusColor = (
  percentage: number,
  categoryType: IBudgetCategoryType = "EXPENSE",
  options?: Omit<IBudgetStatusParams, "percentage" | "categoryType">,
) =>
  resolveBudgetStatus({ percentage, categoryType, ...options }).textColor;

export function getDifferenceColor(
  difference: number,
  categoryType: IBudgetCategoryType = "EXPENSE",
): string {
  if (difference === 0) {
    return "text-text";
  }

  if (categoryType === "INCOME") {
    return difference > 0 ? "text-success" : "text-warning";
  }

  return difference > 0 ? "text-danger" : "text-success";
}

export function getActualColor(
  actual: number,
  expected: number,
  categoryType: IBudgetCategoryType = "EXPENSE",
): string {
  return getDifferenceColor(actual - expected, categoryType);
}
