import { useMemo } from "react";
import {
  type TableSearchConfig,
  useTableSearch,
} from "../hooks/use-table-search";
import {
  TableSearchContext,
} from "./table-search-context";
import { TableSearchDataBridge } from "./table-search-data-bridge";

export type TableSearchProviderProps<T, TContext = unknown> = {
  data: T[];
  search: TableSearchConfig<T, TContext>;
  children: React.ReactNode;
};

export function TableSearchProvider<T, TContext = unknown>({
  data,
  search,
  children,
}: TableSearchProviderProps<T, TContext>) {
  const {
    query,
    setQuery,
    debouncedQuery,
    filteredData,
    totalCount,
    filteredCount,
    isSearching,
  } = useTableSearch({
    data,
    match: search.match,
    context: search.context,
    debounceMs: search.debounceMs,
  });

  const contextValue = useMemo(
    () => ({
      query,
      setQuery,
      debouncedQuery,
      totalCount,
      filteredCount,
      isSearching,
    }),
    [
      query,
      setQuery,
      debouncedQuery,
      totalCount,
      filteredCount,
      isSearching,
    ]
  );

  return (
    <TableSearchContext.Provider value={contextValue}>
      <TableSearchDataBridge filteredData={filteredData}>
        {children}
      </TableSearchDataBridge>
    </TableSearchContext.Provider>
  );
}
