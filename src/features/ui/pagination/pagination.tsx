import { cn } from "@/util/cn";
import { Button } from "../button/button";

export interface IPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: IPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className={cn("flex justify-center items-center gap-2", className)}>
      <Button
        clicked={() => {
          if (hasPrevious) {
            onPageChange(currentPage - 1);
          }
        }}
        buttonContent="Previous"
        disabled={!hasPrevious}
        className={cn(
          "px-4 py-2",
          !hasPrevious && "opacity-50 cursor-not-allowed"
        )}
      />
      <span className="px-4 py-2 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        clicked={() => {
          if (hasNext) {
            onPageChange(currentPage + 1);
          }
        }}
        buttonContent="Next"
        disabled={!hasNext}
        className={cn(
          "px-4 py-2",
          !hasNext && "opacity-50 cursor-not-allowed"
        )}
      />
    </div>
  );
}

