import { ExpenseOverview } from "@/features/transaction/component/expense/expense-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/expenses")({
  component: ExpensesPage,
});

export function ExpensesPage() {
  return <ExpenseOverview />;
}
