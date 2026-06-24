import { createFileRoute } from "@tanstack/react-router";
import { BudgetsPage } from "@/features/budget/pages/budgets-page";

export const Route = createFileRoute("/(app)/$workspaceId/budgets/")({
  component: BudgetsPage,
  head: () => ({
    meta: [
      {
        title: "Budgets | Financely",
      },
    ],
  }),
});
