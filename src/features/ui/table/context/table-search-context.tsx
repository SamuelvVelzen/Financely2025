import { createContext, useContext, useMemo } from "react";
import {
  TableSearchConfig,
  useTableSearch,
} from "../hooks/use-table-search";

export type TableSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
  totalCount: number;
  filteredCount: number;
  isSearching: boolean;
};

export const TableSearchContext =
  createContext<TableSearchContextValue | null>(null);

export function useTableSearchContext(): TableSearchContextValue | null {
  return useContext(TableSearchContext);
}

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

const TableSearchDataContext = createContext<unknown[] | null>(null);

export function useTableSearchFilteredData<T>(): T[] | null {
  const data = useContext(TableSearchDataContext);
  return data as T[] | null;
}

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
