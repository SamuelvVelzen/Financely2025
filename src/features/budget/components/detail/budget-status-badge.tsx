import { Badge } from "@/features/ui/badge/badge";

export type IBudgetCategoryType = "EXPENSE" | "INCOME";

type IBudgetStatusBadgeProps = {
  percentage: number;
  categoryType?: IBudgetCategoryType;
};

export function BudgetStatusBadge({
  percentage,
  categoryType = "EXPENSE",
}: IBudgetStatusBadgeProps) {
  if (categoryType === "INCOME") {
    if (percentage > 100) {
      return <Badge variant="success">Goal Exceeded</Badge>;
    }
    if (percentage >= 80) {
      return <Badge>On Track</Badge>;
    }
    return <Badge variant="warning">Below Target</Badge>;
  }

  if (percentage < 80) return <Badge>On Track</Badge>;
  if (percentage <= 100) return <Badge variant="warning">Near Limit</Badge>;
  return <Badge variant="danger">Over Budget</Badge>;
}

export const getStatusColor = (
  percentage: number,
  categoryType: IBudgetCategoryType = "EXPENSE",
) => {
  if (categoryType === "INCOME") {
    if (percentage > 100) return "text-success";
    if (percentage >= 80) return "text-text";
    return "text-warning";
  }

  if (percentage < 80) return "text-text";
  if (percentage <= 100) return "text-warning";
  return "text-danger";
};

export const getProgressBarColor = (
  percentage: number,
  categoryType: IBudgetCategoryType = "EXPENSE",
) => {
  if (categoryType === "INCOME") {
    if (percentage >= 80) return "bg-success";
    return "bg-warning";
  }

  if (percentage < 80) return "bg-success";
  if (percentage <= 100) return "bg-warning";
  return "bg-danger";
};
