import { TransactionOverview } from "@/features/transaction/components/transaction-overview";
import { deserializeFilterStateFromQuery } from "@/features/transaction/utils/transaction-filter-model";
import { useSearch } from "@tanstack/react-router";

export function TransactionsPage() {
  const search = useSearch({ from: "/(app)/$workspaceId/transactions" });
  const initialState = deserializeFilterStateFromQuery(search);
  return <TransactionOverview initialState={initialState} />;
}
