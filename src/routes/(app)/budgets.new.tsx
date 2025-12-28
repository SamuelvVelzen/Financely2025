import { BudgetCreateOrEditPage } from "@/features/budget/components/create-or-edit/budget-create-or-edit";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/budgets/new")({
  component: BudgetCreatePageComponent,
  head: () => ({
    meta: [
      {
        title: "Create Budget | Financely",
      },
    ],
  }),
});

function BudgetCreatePageComponent() {
  return <BudgetCreateOrEditPage />;
}
