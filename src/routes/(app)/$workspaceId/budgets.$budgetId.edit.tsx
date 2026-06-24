import { createFileRoute } from "@tanstack/react-router";
import { BudgetEditPage } from "@/features/budget/pages/budget-edit-page";

export const Route = createFileRoute("/(app)/$workspaceId/budgets/$budgetId/edit")({
  component: BudgetEditPage,
  head: () => ({
    meta: [
      {
        title: "Edit Budget | Financely",
      },
    ],
  }),
});
