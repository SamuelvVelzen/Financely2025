import {
  type ITransactionFilterQueryParams,
  transactionFilterQuerySchema,
} from "@/features/transaction/utils/transaction-filter-query-schema";
import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/features/transaction/pages/transactions-page";

type ITransactionsSearch = ITransactionFilterQueryParams & {
  create?: true;
};

function parseCreateSearchFlag(value: unknown): true | undefined {
  if (value === true || value === "true" || value === "1") {
    return true;
  }
  return undefined;
}

export const Route = createFileRoute("/(app)/$workspaceId/transactions/")({
  component: TransactionsPage,
  validateSearch: (search: Record<string, unknown>): ITransactionsSearch => {
    const validated = transactionFilterQuerySchema.parse(search);
    const create = parseCreateSearchFlag(search.create);
    // Omit `create` when unset so navigations that only pass filters stay typed.
    return create ? { ...validated, create } : validated;
  },
  head: () => ({
    meta: [
      {
        title: "Transactions | Financely",
      },
    ],
  }),
});
