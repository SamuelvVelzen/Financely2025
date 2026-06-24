import { createFileRoute } from "@tanstack/react-router";
import { BudgetEditPage } from "./budget-edit-page";

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
