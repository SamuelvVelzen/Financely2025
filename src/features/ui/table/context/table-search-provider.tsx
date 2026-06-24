import { useMemo } from "react";
import {
  type TableSearchConfig,
  useTableSearch,
} from "../hooks/use-table-search";
import {
  TableSearchContext,
  TableSearchDataContext,
} from "./table-search-context";

export type TableSearchProviderProps<T, TContext = unknown> = {
  data: T[];
  search: TableSearchConfig<T, TContext>;
  children: React.ReactNode;
};

function TableSearchDataBridge<T>({
  filteredData,
  children,
}: {
  filteredData: T[];
  children: React.ReactNode;
}) {
  return (
    <TableSearchDataContext.Provider value={filteredData}>
      {children}
    </TableSearchDataContext.Provider>
  );
}

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
