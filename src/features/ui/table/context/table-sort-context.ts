import { createContext, useContext } from "react";
import type { SortDirection } from "../header-cell";

export type TableSortContextValue<T> = {
  registerSortFn: (sortKey: string, sortFn: (a: T, b: T) => number) => void;
  unregisterSortFn: (sortKey: string) => void;
  handleSort: (sortKey: string) => void;
  getSortDirection: (sortKey: string) => SortDirection;
  sortedData: T[];
};

export const TableSortContext =
  createContext<TableSortContextValue<unknown> | null>(null);

export function useTableSortContext<T>(): TableSortContextValue<T> | null {
  const context = useContext(TableSortContext);
  return context as TableSortContextValue<T> | null;
}
