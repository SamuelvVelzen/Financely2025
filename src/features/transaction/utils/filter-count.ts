import {
  DEFAULT_FILTER_STATE,
  type ITransactionFilterState,
} from "./transaction-filter-model";

/**
 * Count active filters as individual selections (matches active filter badges).
 * e.g. 3 currencies + 4 tags + amount = 8
 */
export function calculateFilterCount(
  filterState: ITransactionFilterState,
  defaultFilterState: ITransactionFilterState = DEFAULT_FILTER_STATE
): number {
  let count = 0;

  if (filterState.dateFilter.type !== defaultFilterState.dateFilter.type) {
    count++;
  }

  if (filterState.searchQuery.trim()) {
    count++;
  }

  const hasMin = filterState.priceFilter.min !== undefined;
  const hasMax = filterState.priceFilter.max !== undefined;
  const isDefaultPrice =
    filterState.priceFilter.min === defaultFilterState.priceFilter.min &&
    filterState.priceFilter.max === defaultFilterState.priceFilter.max;

  if (!isDefaultPrice && (hasMin || hasMax)) {
    count++;
  }

  count += filterState.tagFilter.length;

  if (
    filterState.transactionTypeFilter.length > 0 &&
    filterState.transactionTypeFilter.length < 2
  ) {
    count++;
  }

  count += filterState.paymentMethodFilter.length;
  count += filterState.currencyFilter.length;

  return count;
}
