import { BudgetDetailPage } from "@/features/budget/components/detail/budget-detail-page";
import { useParams } from "@tanstack/react-router";

export function BudgetDetailPageRoute() {
  const { budgetId } = useParams({
    from: "/(app)/$workspaceId/budgets/$budgetId/",
  });
  return <BudgetDetailPage budgetId={budgetId} />;
}
