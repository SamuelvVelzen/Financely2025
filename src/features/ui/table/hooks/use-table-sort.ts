"use client";

import { useMemo, useState } from "react";
import type { SortDirection } from "../header-cell";

export type SortConfig<T> = {
  sortKey: string;
  direction: SortDirection;
  sortFn?: (a: T, b: T) => number;
};

export type UseTableSortOptions<T> = {
  data: T[];
  defaultSort?: SortConfig<T>;
  sortFns?: Record<string, (a: T, b: T) => number>;
};

export function useTableSort<T>({
  data,
  defaultSort,
  sortFns = {},
}: UseTableSortOptions<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    defaultSort || null
  );

  const handleSort = (
    sortKey: string,
    direction: SortDirection,
    customSortFn?: (a: T, b: T) => number
  ) => {
    if (!direction) {
      setSortConfig(null);
      return;
    }

    setSortConfig({
      sortKey,
      direction,
      sortFn: customSortFn,
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.direction) {
      return data;
    }

    const sorted = [...data];
    const { sortKey, direction, sortFn } = sortConfig;

    // Use custom sort function if provided, otherwise try to find one in sortFns
    const fn = sortFn || sortFns[sortKey];

    if (fn) {
      sorted.sort((a, b) => {
        const result = fn(a, b);
        return direction === "asc" ? result : -result;
      });
    } else {
      // Default sorting based on data type
      sorted.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // String comparison
        if (typeof aVal === "string" && typeof bVal === "string") {
          const result = aVal.localeCompare(bVal);
          return direction === "asc" ? result : -result;
        }

        // Number comparison
        if (typeof aVal === "number" && typeof bVal === "number") {
          const result = aVal - bVal;
          return direction === "asc" ? result : -result;
        }

        // Date comparison (ISO strings)
        if (typeof aVal === "string" && typeof bVal === "string") {
          const aDate = new Date(aVal).getTime();
          const bDate = new Date(bVal).getTime();
          if (!isNaN(aDate) && !isNaN(bDate)) {
            const result = aDate - bDate;
            return direction === "asc" ? result : -result;
          }
        }

        // Fallback to string comparison
        const result = String(aVal).localeCompare(String(bVal));
        return direction === "asc" ? result : -result;
      });
    }

    return sorted;
  }, [data, sortConfig, sortFns]);

  const getSortDirection = (sortKey: string): SortDirection => {
    if (sortConfig?.sortKey === sortKey) {
      return sortConfig.direction;
    }
    return null;
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    getSortDirection,
  };
}
