import { TransactionOverview } from "@/features/transaction/components/transaction-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/transactions")({
  component: TransactionsPage,
  head: () => ({
    meta: [
      {
        title: "Transactions | Financely",
      },
    ],
  }),
});

export function TransactionsPage() {
  return <TransactionOverview />;
}

