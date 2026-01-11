import type { IPriceRange } from "@/features/ui/input/range-input";
import type { ITransactionFilterState } from "./transaction-filter-model";

/**
 * Calculate the count of active secondary filters
 * Secondary filters are: price, tags, transaction type (when only one selected),
 * payment method, and currency
 */
export function calculateFilterCount(
  filterState: ITransactionFilterState
): number {
  let count = 0;

  // Price filter
  if (
    filterState.priceFilter.min !== undefined ||
    filterState.priceFilter.max !== undefined
  ) {
    count++;
  }

  // Tag filter
  if (filterState.tagFilter.length > 0) {
    count++;
  }

  // Transaction type filter (only count if exactly one type is selected)
  if (
    filterState.transactionTypeFilter.length > 0 &&
    filterState.transactionTypeFilter.length < 2
  ) {
    count++;
  }

  // Payment method filter
  if (filterState.paymentMethodFilter.length > 0) {
    count++;
  }

  // Currency filter
  if (filterState.currencyFilter.length > 0) {
    count++;
  }

  return count;
}


