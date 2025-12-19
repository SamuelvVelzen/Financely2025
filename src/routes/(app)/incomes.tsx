import { IncomeOverview } from "@/features/transaction/components/income/income-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/incomes")({
  component: IncomesPage,
  head: () => ({
    meta: [
      {
        title: "Incomes | Financely",
      },
    ],
  }),
});

export function IncomesPage() {
  return <IncomeOverview />;
}
