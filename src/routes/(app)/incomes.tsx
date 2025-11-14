import { IncomeOverview } from "@/features/transaction/component/income/income-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/incomes")({
  component: IncomesPage,
});

export function IncomesPage() {
  return <IncomeOverview />;
}
