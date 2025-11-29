"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { SortDirection } from "../header-cell";
import type { SortConfig } from "../hooks/use-table-sort";
import { useTableSort } from "../hooks/use-table-sort";

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

export type TableSortProviderProps<T> = {
  data: T[];
  defaultSort?: SortConfig<T>;
  children: React.ReactNode;
};

export function TableSortProvider<T>({
  data,
  defaultSort,
  children,
}: TableSortProviderProps<T>) {
  // Use ref to store sort functions to avoid re-renders when they're registered
  const sortFnsRef = useRef<Record<string, (a: T, b: T) => number>>({});
  const [sortFns, setSortFns] = useState<
    Record<string, (a: T, b: T) => number>
  >({});

  const registerSortFn = (sortKey: string, sortFn: (a: T, b: T) => number) => {
    sortFnsRef.current[sortKey] = sortFn;
    setSortFns({ ...sortFnsRef.current });
  };

  const unregisterSortFn = (sortKey: string) => {
    delete sortFnsRef.current[sortKey];
    setSortFns({ ...sortFnsRef.current });
  };

  const {
    sortedData,
    handleSort: internalHandleSort,
    getSortDirection,
  } = useTableSort({
    data,
    defaultSort,
    sortFns,
  });

  const handleSort = (sortKey: string) => {
    const currentDirection = getSortDirection(sortKey);
    let newDirection: SortDirection = "asc";
    if (currentDirection === "asc") {
      newDirection = "desc";
    } else if (currentDirection === "desc") {
      newDirection = null;
    }

    const sortFn = sortFnsRef.current[sortKey];
    internalHandleSort(sortKey, newDirection, sortFn);
  };

  const value: TableSortContextValue<T> = {
    registerSortFn,
    unregisterSortFn,
    handleSort,
    getSortDirection,
    sortedData,
  };

  return (
    <TableSortContext.Provider value={value as TableSortContextValue<unknown>}>
      {children}
    </TableSortContext.Provider>
  );
}
