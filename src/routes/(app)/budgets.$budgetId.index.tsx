import { BudgetDetailPage } from "@/features/budget/components/detail/budget-detail-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/budgets/$budgetId/")({
  component: BudgetDetailPageComponent,
  head: () => ({
    meta: [
      {
        title: "Budget Details | Financely",
      },
    ],
  }),
});

function BudgetDetailPageComponent() {
  const { budgetId } = Route.useParams();
  return <BudgetDetailPage budgetId={budgetId} />;
}
