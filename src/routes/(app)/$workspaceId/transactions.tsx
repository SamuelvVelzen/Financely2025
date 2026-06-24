import { transactionFilterQuerySchema } from "@/features/transaction/utils/transaction-filter-query-schema";
import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/features/transaction/pages/transactions-page";

export const Route = createFileRoute("/(app)/$workspaceId/transactions")({
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
