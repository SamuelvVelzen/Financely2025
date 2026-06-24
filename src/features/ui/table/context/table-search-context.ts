import { createContext, useContext } from "react";

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

const TableSearchDataContext = createContext<unknown[] | null>(null);

export function useTableSearchFilteredData<T>(): T[] | null {
  const data = useContext(TableSearchDataContext);
  return data as T[] | null;
}

export { TableSearchDataContext };
