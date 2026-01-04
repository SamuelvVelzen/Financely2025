import { createContext, useContext, useMemo } from "react";
import { usePagination } from "./use-pagination";

export type TablePaginationContextValue = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPage: (page: number) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  paginate: <T>(items: T[]) => T[];
};

export const TablePaginationContext =
  createContext<TablePaginationContextValue | null>(null);

export function useTablePaginationContext(): TablePaginationContextValue | null {
  return useContext(TablePaginationContext);
}

export type TablePaginationProviderProps = {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
  children: React.ReactNode;
};

export function TablePaginationProvider({
  totalItems,
  pageSize = 20,
  initialPage = 1,
  children,
}: TablePaginationProviderProps) {
  const pagination = usePagination({
    totalItems,
    pageSize,
    initialPage,
  });

  const value: TablePaginationContextValue = useMemo(
    () => ({
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      pageSize: pagination.pageSize,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
      hasPrevious: pagination.hasPrevious,
      hasNext: pagination.hasNext,
      goToPage: pagination.goToPage,
      goToPrevious: pagination.goToPrevious,
      goToNext: pagination.goToNext,
      setCurrentPage: pagination.setCurrentPage,
      paginate: pagination.paginate,
    }),
    [pagination]
  );

  return (
    <TablePaginationContext.Provider value={value}>
      {children}
    </TablePaginationContext.Provider>
  );
}
