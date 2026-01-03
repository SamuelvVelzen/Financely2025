import { TransactionOverview } from "@/features/transaction/components/transaction-overview";
import { transactionFilterQuerySchema } from "@/features/transaction/utils/transaction-filter-query-schema";
import { deserializeFilterStateFromQuery } from "@/features/transaction/utils/transaction-filter-model";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/transactions")({
  component: TransactionsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const validated = transactionFilterQuerySchema.parse(search);
    return validated;
  },
  head: () => ({
    meta: [
      {
        title: "Transactions | Financely",
      },
    ],
  }),
});

export function TransactionsPage() {
  const search = Route.useSearch();
  const initialState = deserializeFilterStateFromQuery(search);
  return <TransactionOverview initialState={initialState} />;
}

