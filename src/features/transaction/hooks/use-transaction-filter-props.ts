import type { ITag } from "@/features/shared/validation/schemas";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import type { ITransactionFilterState } from "@/features/transaction/utils/transaction-filter-model";
import type { IDateFilter } from "@/features/ui/datepicker/datepicker";
import type { IPriceRange } from "@/features/ui/input/range-input";
import type { UseFormReturn } from "react-hook-form";
import { useMemo } from "react";

/**
 * Filter props interface for TransactionOverviewHeader
 */
export interface IFilterProps {
  form: UseFormReturn<IFilterFormValues>;
  filterState: ITransactionFilterState;
  dateFilter: IDateFilter;
  onDateFilterChange: (filter: IDateFilter) => void;
  priceFilter: IPriceRange;
  onPriceFilterChange: (filter: IPriceRange) => void;
  tags: ITag[];
  onClearAll: () => void;
  hasActiveFilters: boolean;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tags: string[]) => void;
  filterSheetOpen: boolean;
  onFilterSheetOpenChange: (open: boolean) => void;
}

/**
 * Hook to create filter props object with memoization
 */
export function useTransactionFilterProps(
  filterState: ITransactionFilterState,
  form: UseFormReturn<IFilterFormValues>,
  setters: {
    setDateFilter: (filter: IDateFilter) => void;
    setPriceFilter: (filter: IPriceRange) => void;
    setSearchQuery: (query: string) => void;
    setTagFilter: (tags: string[]) => void;
    clearAllFilters: () => void;
  },
  tags: ITag[],
  filterSheetState: {
    filterSheetOpen: boolean;
    onFilterSheetOpenChange: (open: boolean) => void;
  },
  hasActiveFilters: boolean
): IFilterProps {
  return useMemo(
    () => ({
      form,
      filterState,
      dateFilter: filterState.dateFilter,
      onDateFilterChange: setters.setDateFilter,
      priceFilter: filterState.priceFilter,
      onPriceFilterChange: setters.setPriceFilter,
      tags,
      onClearAll: setters.clearAllFilters,
      hasActiveFilters,
      setSearchQuery: setters.setSearchQuery,
      setTagFilter: setters.setTagFilter,
      filterSheetOpen: filterSheetState.filterSheetOpen,
      onFilterSheetOpenChange: filterSheetState.onFilterSheetOpenChange,
    }),
    [
      form,
      filterState,
      setters.setDateFilter,
      setters.setPriceFilter,
      setters.setSearchQuery,
      setters.setTagFilter,
      setters.clearAllFilters,
      tags,
      filterSheetState.filterSheetOpen,
      filterSheetState.onFilterSheetOpenChange,
      hasActiveFilters,
    ]
  );
}

