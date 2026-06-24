import {
  DEFAULT_FILTER_STATE,
  type ITransactionFilterState,
} from "./transaction-filter-model";

/** Stable badge ids used for ordering active filter chips. */
export function collectFilterBadgeIds(
  filterState: ITransactionFilterState,
  defaultFilterState: ITransactionFilterState = DEFAULT_FILTER_STATE
): string[] {
  const ids: string[] = [];

  if (filterState.dateFilter.type !== defaultFilterState.dateFilter.type) {
    ids.push("date");
  }

  filterState.tagFilter.forEach((tagId) => {
    ids.push(`tag-${tagId}`);
  });

  const hasMin = filterState.priceFilter.min !== undefined;
  const hasMax = filterState.priceFilter.max !== undefined;
  const isDefaultPrice =
    filterState.priceFilter.min === defaultFilterState.priceFilter.min &&
    filterState.priceFilter.max === defaultFilterState.priceFilter.max;

  if (!isDefaultPrice && (hasMin || hasMax)) {
    ids.push("amount");
  }

  if (filterState.searchQuery.trim()) {
    ids.push("search");
  }

  if (filterState.transactionTypeFilter.length === 1) {
    ids.push("transactionType");
  }

  filterState.paymentMethodFilter.forEach((method) => {
    ids.push(`paymentMethod-${method}`);
  });

  filterState.currencyFilter.forEach((currency) => {
    ids.push(`currency-${currency}`);
  });

  return ids;
}

export function isFilterBadgeValueChanged(
  previous: ITransactionFilterState,
  current: ITransactionFilterState,
  badgeId: string
): boolean {
  switch (badgeId) {
    case "date":
      return (
        previous.dateFilter.type !== current.dateFilter.type ||
        previous.dateFilter.from !== current.dateFilter.from ||
        previous.dateFilter.to !== current.dateFilter.to
      );
    case "amount":
      return (
        previous.priceFilter.min !== current.priceFilter.min ||
        previous.priceFilter.max !== current.priceFilter.max
      );
    case "search":
      return previous.searchQuery !== current.searchQuery;
    case "transactionType":
      return (
        JSON.stringify(previous.transactionTypeFilter) !==
        JSON.stringify(current.transactionTypeFilter)
      );
    default:
      if (badgeId.startsWith("tag-")) {
        return false;
      }
      if (badgeId.startsWith("paymentMethod-")) {
        return false;
      }
      if (badgeId.startsWith("currency-")) {
        return false;
      }
      return false;
  }
}

export function sortFilterBadgesByOrder<T extends { id: string }>(
  badges: T[],
  badgeOrder: string[]
): T[] {
  if (badgeOrder.length === 0) {
    return badges;
  }

  const orderIndex = new Map(badgeOrder.map((id, index) => [id, index]));

  return [...badges].sort((a, b) => {
    const aIndex = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}
