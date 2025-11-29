"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, useEffect } from "react";
import { HiArrowDown, HiArrowUp, HiArrowsUpDown } from "react-icons/hi2";
import { useTableSortContext } from "./context/table-sort-context";

export type SortDirection = "asc" | "desc" | null;

export type IHeaderCellProps<T = unknown> = {
  align?: "left" | "right" | "center";
  sortable?: boolean;
  sortKey?: string;
  sortFn?: (a: T, b: T) => number;
  autoFit?: boolean;
} & IPropsWithClassName &
  PropsWithChildren;

export function HeaderCell<T = unknown>({
  align = "center",
  className,
  children,
  sortable = true,
  sortKey,
  sortFn,
  autoFit = true,
}: IHeaderCellProps<T>) {
  const sortContext = useTableSortContext<T>();
  const alignClasses = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  };

  // Register sort function when component mounts
  useEffect(() => {
    if (sortKey && sortFn && sortContext) {
      sortContext.registerSortFn(sortKey, sortFn);
      return () => {
        sortContext.unregisterSortFn(sortKey);
      };
    }
  }, [sortKey, sortFn, sortContext]);

  const sortDirection =
    sortKey && sortContext ? sortContext.getSortDirection(sortKey) : null;

  const handleClick = () => {
    if (!sortable || !sortKey || !sortContext) return;
    sortContext.handleSort(sortKey);
  };

  const getSortIcon = () => {
    if (!sortable || !sortKey) return null;

    if (sortDirection === "asc") {
      return <HiArrowUp className="w-4 h-4" />;
    }
    if (sortDirection === "desc") {
      return <HiArrowDown className="w-4 h-4" />;
    }
    return <HiArrowsUpDown className="w-4 h-4 opacity-40" />;
  };

  return (
    <th
      className={cn(
        "p-4",
        alignClasses[align],
        autoFit ? "w-auto" : "w-full min-w-0",
        sortable &&
          sortKey &&
          sortContext &&
          "cursor-pointer select-none hover:bg-surface-hover motion-safe:transition-colors",
        className
      )}
      onClick={handleClick}
      role={sortable && sortKey && sortContext ? "button" : undefined}
      tabIndex={sortable && sortKey && sortContext ? 0 : undefined}
      onKeyDown={(e) => {
        if (
          (e.key === "Enter" || e.key === " ") &&
          sortable &&
          sortKey &&
          sortContext
        ) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-sort={
        sortDirection === "asc"
          ? "ascending"
          : sortDirection === "desc"
            ? "descending"
            : sortable && sortKey
              ? "none"
              : undefined
      }
    >
      <div className="flex items-center gap-2">
        {children}
        {getSortIcon()}
      </div>
    </th>
  );
}
