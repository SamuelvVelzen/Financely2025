import { BudgetFormPage } from "@/features/budget/components/create-or-edit/budget-form-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/budgets/$budgetId/edit")({
  component: BudgetEditPageComponent,
  head: () => ({
    meta: [
      {
        title: "Edit Budget | Financely",
      },
    ],
  }),
});

function BudgetEditPageComponent() {
  const { budgetId } = Route.useParams();
  return <BudgetFormPage budgetId={budgetId} />;
}
