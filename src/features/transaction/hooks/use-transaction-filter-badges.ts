import type { ITag } from "@/features/shared/validation/schemas";
import { useFilterBadgeOrder } from "@/features/transaction/hooks/use-filter-badge-order";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import {
  generateFilterBadges,
  type IFilterBadge,
} from "@/features/transaction/utils/filter-badges";
import {
  DEFAULT_FILTER_STATE,
  type ITransactionFilterState,
} from "@/features/transaction/utils/transaction-filter-model";
import type { IDateFilter } from "@/features/ui/datepicker/datepicker";
import type { IPriceRange } from "@/features/ui/input/range-input";
import { useMemo } from "react";

interface IUseTransactionFilterBadgesOptions {
  filterState: ITransactionFilterState;
  tags: ITag[];
  onDateFilterChange: (filter: IDateFilter) => void;
  onPriceFilterChange: (filter: IPriceRange) => void;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tags: string[]) => void;
  setTransactionTypeFilter?: (types: string[]) => void;
  setPaymentMethodFilter?: (methods: string[]) => void;
  setCurrencyFilter?: (currencies: string[]) => void;
}

export function useTransactionFilterBadges({
  filterState,
  tags,
  onDateFilterChange,
  onPriceFilterChange,
  setSearchQuery,
  setTagFilter,
  setTransactionTypeFilter,
  setPaymentMethodFilter,
  setCurrencyFilter,
}: IUseTransactionFilterBadgesOptions): IFilterBadge[] {
  const badgeOrder = useFilterBadgeOrder(filterState);

  return useMemo(() => {
    return generateFilterBadges({
      filterState,
      tags,
      badgeOrder,
      onRemoveDate: () => onDateFilterChange(DEFAULT_FILTER_STATE.dateFilter),
      onRemoveTag: (tagId) => {
        setTagFilter(filterState.tagFilter.filter((id) => id !== tagId));
      },
      onRemoveAmount: () =>
        onPriceFilterChange(DEFAULT_FILTER_STATE.priceFilter),
      onRemoveSearch: () => setSearchQuery(""),
      onRemoveTransactionType: setTransactionTypeFilter
        ? () => setTransactionTypeFilter([])
        : undefined,
      onRemovePaymentMethod: setPaymentMethodFilter
        ? (method) => {
            setPaymentMethodFilter(
              filterState.paymentMethodFilter.filter((item) => item !== method)
            );
          }
        : undefined,
      onRemoveCurrency: setCurrencyFilter
        ? (currency) => {
            setCurrencyFilter(
              filterState.currencyFilter.filter((item) => item !== currency)
            );
          }
        : undefined,
    });
  }, [
    filterState,
    tags,
    badgeOrder,
    onDateFilterChange,
    onPriceFilterChange,
    setSearchQuery,
    setTagFilter,
    setTransactionTypeFilter,
    setPaymentMethodFilter,
    setCurrencyFilter,
  ]);
}

export type { IFilterBadge, IFilterFormValues };
