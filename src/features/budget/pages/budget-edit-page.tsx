import { BudgetCreateOrEditPage } from "@/features/budget/components/create-or-edit/budget-create-or-edit";
import { useParams } from "@tanstack/react-router";

export function BudgetEditPage() {
  const { budgetId } = useParams({
    from: "/(app)/$workspaceId/budgets/$budgetId/edit",
  });
  return <BudgetCreateOrEditPage budgetId={budgetId} />;
}
