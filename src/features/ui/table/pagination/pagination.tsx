import { cn } from "@/features/util/cn";
import { Button } from "../../button/button";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { useMemo } from "react";

export interface IPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showPageNumbers = true,
  maxVisiblePages = 7,
}: IPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Generate page numbers to display with ellipsis logic
  const pageNumbers = useMemo(() => {
    if (!showPageNumbers) return [];

    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push("ellipsis");
      }

      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages, showPageNumbers]);

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <nav
      className={cn("flex justify-center items-center gap-1", className)}
      aria-label="Pagination">
      {/* First page button */}
      <Button
        clicked={() => handlePageClick(1)}
        disabled={!hasPrevious}
        size="sm"
        variant="default"
        className={cn(
          "px-2 py-1 min-w-[2rem]",
          !hasPrevious && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Go to first page"
        title="First page">
        <HiChevronLeft className="size-4" />
        <HiChevronLeft className="size-4 -ml-2" />
      </Button>

      {/* Previous page button */}
      <Button
        clicked={() => handlePageClick(currentPage - 1)}
        disabled={!hasPrevious}
        size="sm"
        variant="default"
        className={cn(
          "px-2 py-1 min-w-[2rem]",
          !hasPrevious && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Go to previous page"
        title="Previous page">
        <HiChevronLeft className="size-4" />
      </Button>

      {/* Page numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-sm text-text-muted"
                  aria-hidden="true">
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;

            return (
              <Button
                key={page}
                clicked={() => handlePageClick(page)}
                size="sm"
                variant={isCurrentPage ? "primary" : "default"}
                className={cn(
                  "px-3 py-1 min-w-[2.5rem] text-sm font-medium",
                  isCurrentPage && "pointer-events-none"
                )}
                aria-label={`Go to page ${page}`}
                aria-current={isCurrentPage ? "page" : undefined}
                title={`Page ${page}`}>
                {page}
              </Button>
            );
          })}
        </div>
      )}

      {/* Page info (shown when page numbers are hidden) */}
      {!showPageNumbers && (
        <span className="px-3 py-1 text-sm text-text-muted mx-2">
          Page {currentPage} of {totalPages}
        </span>
      )}

      {/* Next page button */}
      <Button
        clicked={() => handlePageClick(currentPage + 1)}
        disabled={!hasNext}
        size="sm"
        variant="default"
        className={cn(
          "px-2 py-1 min-w-[2rem]",
          !hasNext && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Go to next page"
        title="Next page">
        <HiChevronRight className="size-4" />
      </Button>

      {/* Last page button */}
      <Button
        clicked={() => handlePageClick(totalPages)}
        disabled={!hasNext}
        size="sm"
        variant="default"
        className={cn(
          "px-2 py-1 min-w-[2rem]",
          !hasNext && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Go to last page"
        title="Last page">
        <HiChevronRight className="size-4" />
        <HiChevronRight className="size-4 -ml-2" />
      </Button>
    </nav>
  );
}
