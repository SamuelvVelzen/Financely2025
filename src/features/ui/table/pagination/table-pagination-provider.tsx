import { useMemo } from "react";
import { usePagination } from "./use-pagination";
import { TablePaginationContext, type TablePaginationContextValue } from "./table-pagination-context";

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
