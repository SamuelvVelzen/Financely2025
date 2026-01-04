import { useCallback, useMemo, useState } from "react";

export interface IUsePaginationOptions {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

export interface IUsePaginationReturn {
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
}

export function usePagination({
  totalItems,
  pageSize = 20,
  initialPage = 1,
}: IUsePaginationOptions): IUsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  // Ensure current page is within bounds when totalPages changes
  const boundedCurrentPage = useMemo(() => {
    if (currentPage > totalPages) {
      return totalPages;
    }
    if (currentPage < 1) {
      return 1;
    }
    return currentPage;
  }, [currentPage, totalPages]);

  const startIndex = useMemo(
    () => (boundedCurrentPage - 1) * pageSize,
    [boundedCurrentPage, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  const hasPrevious = boundedCurrentPage > 1;
  const hasNext = boundedCurrentPage < totalPages;

  const goToPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(targetPage);
    },
    [totalPages]
  );

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentPage((p) => p - 1);
    }
  }, [hasPrevious]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentPage((p) => p + 1);
    }
  }, [hasNext]);

  const paginate = useCallback(
    <T,>(items: T[]): T[] => {
      return items.slice(startIndex, startIndex + pageSize);
    },
    [startIndex, pageSize]
  );

  return {
    currentPage: boundedCurrentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    hasPrevious,
    hasNext,
    goToPage,
    goToPrevious,
    goToNext,
    setCurrentPage,
    paginate,
  };
}

