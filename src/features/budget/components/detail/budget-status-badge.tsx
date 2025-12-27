import { Badge } from "@/features/ui/badge/badge";

type IBudgetStatusBadgeProps = {
  percentage: number;
};

export function BudgetStatusBadge({ percentage }: IBudgetStatusBadgeProps) {
  if (percentage < 80) return <Badge>On Track</Badge>;
  if (percentage <= 100) return <Badge variant="warning">Near Limit</Badge>;
  return <Badge variant="danger">Over Budget</Badge>;
}

export const getStatusColor = (percentage: number) => {
  if (percentage < 80) return "text-text";
  if (percentage <= 100) return "text-warning";
  return "text-danger";
};
