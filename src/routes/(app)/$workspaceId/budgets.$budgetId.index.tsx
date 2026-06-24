import { createFileRoute } from "@tanstack/react-router";
import { BudgetDetailPageRoute } from "./budget-detail-page";

export const Route = createFileRoute("/(app)/$workspaceId/budgets/$budgetId/")({
  component: BudgetDetailPageRoute,
  head: () => ({
    meta: [
      {
        title: "Budget Details | Financely",
      },
    ],
  }),
});
