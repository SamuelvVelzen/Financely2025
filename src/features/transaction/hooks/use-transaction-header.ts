import type { ITransactionFilterState } from "@/features/transaction/utils/transaction-filter-model";
import { formatMonthYear } from "@/features/util/date/date-helpers";
import { useMemo } from "react";

/**
 * Hook for transaction header logic
 * Extracts month display calculation from component
 */
export function useTransactionHeader(
  filterState: ITransactionFilterState
) {
  const monthDisplay = useMemo(() => {
    if (filterState.dateFilter.type === "allTime") {
      return "All Time";
    }
    if (filterState.dateFilter.type === "thisMonth") {
      return formatMonthYear(new Date());
    }
    if (filterState.dateFilter.type === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return formatMonthYear(lastMonth);
    }
    if (
      filterState.dateFilter.type === "custom" &&
      filterState.dateFilter.from &&
      filterState.dateFilter.to
    ) {
      const from = formatMonthYear(filterState.dateFilter.from);
      const to = formatMonthYear(filterState.dateFilter.to);
      return `${from} - ${to}`;
    }
    return formatMonthYear(new Date());
  }, [filterState.dateFilter]);

  return { monthDisplay };
}

