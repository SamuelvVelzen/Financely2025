import { createFileRoute } from "@tanstack/react-router";
import { BudgetCreatePage } from "./budget-create-page";

export const Route = createFileRoute("/(app)/$workspaceId/budgets/new")({
  component: BudgetCreatePage,
  head: () => ({
    meta: [
      {
        title: "Create Budget | Financely",
      },
    ],
  }),
});
