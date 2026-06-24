import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SortConfig } from "../hooks/use-table-sort";
import { useTableSort } from "../hooks/use-table-sort";
import { TableSortContext, type TableSortContextValue } from "./table-sort-context";
import type { SortDirection } from "../header-cell";

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
  const sortFnsRef = useRef<Record<string, (a: T, b: T) => number>>({});
  const [sortFns, setSortFns] = useState<
    Record<string, (a: T, b: T) => number>
  >({});

  const registerSortFn = useCallback(
    (sortKey: string, sortFn: (a: T, b: T) => number) => {
      if (sortFnsRef.current[sortKey] !== sortFn) {
        sortFnsRef.current[sortKey] = sortFn;
        setSortFns({ ...sortFnsRef.current });
      }
    },
    []
  );

  const unregisterSortFn = useCallback((sortKey: string) => {
    if (sortKey in sortFnsRef.current) {
      delete sortFnsRef.current[sortKey];
      setSortFns({ ...sortFnsRef.current });
    }
  }, []);

  const {
    sortedData,
    handleSort: internalHandleSort,
    getSortDirection,
  } = useTableSort({
    data,
    defaultSort,
    sortFns,
  });

  const handleSort = useCallback(
    (sortKey: string) => {
      const currentDirection = getSortDirection(sortKey);
      let newDirection: SortDirection = "asc";
      if (currentDirection === "asc") {
        newDirection = "desc";
      } else if (currentDirection === "desc") {
        newDirection = null;
      }

      const sortFn = sortFnsRef.current[sortKey];
      internalHandleSort(sortKey, newDirection, sortFn);
    },
    [getSortDirection, internalHandleSort]
  );

  const value: TableSortContextValue<T> = useMemo(
    () => ({
      registerSortFn,
      unregisterSortFn,
      handleSort,
      getSortDirection,
      sortedData,
    }),
    [registerSortFn, unregisterSortFn, handleSort, getSortDirection, sortedData]
  );

  return (
    <TableSortContext.Provider value={value as TableSortContextValue<unknown>}>
      {children}
    </TableSortContext.Provider>
  );
}
