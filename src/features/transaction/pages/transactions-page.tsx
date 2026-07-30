import { TransactionOverview } from "@/features/transaction/components/transaction-overview";
import { deserializeFilterStateFromQuery } from "@/features/transaction/utils/transaction-filter-model";
import { useSearch } from "@tanstack/react-router";

export function TransactionsPage() {
  const search = useSearch({ from: "/(app)/$workspaceId/transactions" });
  const autoOpenCreate = "create" in search && search.create === true;
  const filterSearch =
    "create" in search
      ? (() => {
          const { create: _create, ...rest } = search;
          return rest;
        })()
      : search;
  const initialState = deserializeFilterStateFromQuery(filterSearch);

  return (
    <TransactionOverview
      initialState={initialState}
      autoOpenCreate={autoOpenCreate}
    />
  );
}
