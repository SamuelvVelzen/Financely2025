import { ExpenseOverview } from "@/features/transaction/components/expense/expense-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/expenses")({
  component: ExpensesPage,
  head: () => ({
    meta: [
      {
        title: "Expenses | Financely",
      },
    ],
  }),
});

export function ExpensesPage() {
  return <ExpenseOverview />;
}
