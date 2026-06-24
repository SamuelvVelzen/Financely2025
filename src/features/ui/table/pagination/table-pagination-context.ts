import { createContext, useContext } from "react";

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
