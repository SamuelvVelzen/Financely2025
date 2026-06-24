import { createFileRoute } from "@tanstack/react-router";
import { BudgetsPage } from "./budgets-page";

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
