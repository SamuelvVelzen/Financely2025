import { BudgetOverview } from "@/features/budget/components/overview/budget-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/budgets/")({
  component: BudgetsPage,
  head: () => ({
    meta: [
      {
        title: "Budgets | Financely",
      },
    ],
  }),
});

export function BudgetsPage() {
  return <BudgetOverview />;
}
