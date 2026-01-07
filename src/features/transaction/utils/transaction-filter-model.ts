/**
 * Transaction Filter Model
 *
 * A canonical, versionable filter state model for transaction filtering.
 * Provides normalization, validation, and serialization utilities.
 */

import type { IDateFilter } from "@/features/ui/datepicker/datepicker";
import type { IPriceRange } from "@/features/ui/input/range-input";
import {
  getCurrentMonthEnd,
  getCurrentMonthStart,
  getLastMonthEnd,
  getLastMonthStart,
} from "@/features/util/date/date-helpers";
import { isValid, parseISO } from "date-fns";

/**
 * Separator used for array values in URL query parameters
 * Using semicolon to avoid URL encoding issues with commas
 */
const ARRAY_SEPARATOR = "|";

/**
 * Helper function to join array values for URL query parameters
 */
function joinArrayForQuery(values: string[]): string {
  return values.join(ARRAY_SEPARATOR);
}

/**
 * Helper function to split query parameter string back into array
 */
function splitQueryToArray(value: string): string[] {
  return value.split(ARRAY_SEPARATOR).filter((item) => item.length > 0);
}

/**
 * Canonical filter state model.
 *
 * This structure is stable. When adding new fields:
 * 1. Add the field to this interface
 * 2. Update the default state
 * 3. Update normalization logic
 * 4. Update serialization/deserialization
 */
export interface ITransactionFilterState {
  /**
   * Date filter configuration
   */
  dateFilter: IDateFilter;

  /**
   * Price/amount range filter
   * - undefined means "unset" (no filter applied)
   * - number means filter is active
   */
  priceFilter: IPriceRange;

  /**
   * Search query string
   * - Empty string means "unset" (no search)
   * - Non-empty string means search is active
   */
  searchQuery: string;

  /**
   * Tag filter - array of tag IDs
   * - Empty array means "unset" (no tag filter)
   * - Non-empty array means tags are filtered
   */
  tagFilter: string[];

  /**
   * Transaction type filter - array of transaction types
   * - Empty array means "unset" (show all types)
   * - ["EXPENSE"] means expenses only
   * - ["INCOME"] means incomes only
   * - ["EXPENSE", "INCOME"] means show all (same as empty)
   */
  transactionTypeFilter: string[];

  /**
   * Payment method filter - array of payment method values
   * - Empty array means "unset" (show all payment methods)
   * - Non-empty array means filter by selected payment methods
   */
  paymentMethodFilter: string[];

  /**
   * Currency filter - array of currency codes
   * - Empty array means "unset" (show all currencies)
   * - Non-empty array means filter by selected currencies
   */
  currencyFilter: string[];
}

/**
 * Default date filter state
 */
const defaultDateFilter: IDateFilter = {
  type: "allTime",
  from: getCurrentMonthStart(),
  to: getCurrentMonthEnd(),
};

/**
 * Default price filter state (all unset)
 */
const defaultPriceFilter: IPriceRange = {
  min: undefined,
  max: undefined,
};

/**
 * Default filter state - the canonical "unfiltered" state
 */
export const DEFAULT_FILTER_STATE: ITransactionFilterState = {
  dateFilter: defaultDateFilter,
  priceFilter: defaultPriceFilter,
  searchQuery: "",
  tagFilter: [],
  transactionTypeFilter: [],
  paymentMethodFilter: [],
  currencyFilter: [],
};

/**
 * Normalize a date filter to ensure it's valid
 */
function normalizeDateFilter(filter: IDateFilter): IDateFilter {
  // Validate date filter type
  const validTypes: IDateFilter["type"][] = [
    "allTime",
    "thisMonth",
    "lastMonth",
    "custom",
  ];
  const type = validTypes.includes(filter.type) ? filter.type : "thisMonth";

  // For custom type, validate dates
  if (type === "custom") {
    let from = filter.from;
    let to = filter.to;

    // Validate ISO date strings
    if (from) {
      try {
        const date = parseISO(from);
        if (!isValid(date)) {
          from = undefined;
        }
      } catch {
        from = undefined;
      }
    }

    if (to) {
      try {
        const date = parseISO(to);
        if (!isValid(date)) {
          to = undefined;
        }
      } catch {
        to = undefined;
      }
    }

    // If custom but no valid dates, fall back to thisMonth
    if (!from && !to) {
      return defaultDateFilter;
    }

    // Ensure from <= to if both are set
    if (from && to) {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      if (fromDate > toDate) {
        // Swap if invalid order
        return {
          type: "custom",
          from: to,
          to: from,
        };
      }
    }

    return {
      type: "custom",
      from,
      to,
    };
  }

  // For non-custom types, ensure dates match the type
  if (type === "thisMonth") {
    return {
      type: "thisMonth",
      from: getCurrentMonthStart(),
      to: getCurrentMonthEnd(),
    };
  }

  if (type === "lastMonth") {
    return {
      type: "lastMonth",
      from: getLastMonthStart(),
      to: getLastMonthEnd(),
    };
  }

  // allTime
  return {
    type: "allTime",
    from: undefined,
    to: undefined,
  };
}

/**
 * Normalize a price filter to ensure it's valid
 */
function normalizePriceFilter(filter: IPriceRange): IPriceRange {
  let min = filter.min;
  let max = filter.max;

  // Validate numbers
  if (min !== undefined) {
    if (typeof min !== "number" || !isFinite(min) || min < 0) {
      min = undefined;
    }
  }

  if (max !== undefined) {
    if (typeof max !== "number" || !isFinite(max) || max < 0) {
      max = undefined;
    }
  }

  // Ensure min <= max if both are set
  if (min !== undefined && max !== undefined && min > max) {
    // Swap if invalid order
    return {
      min: max,
      max: min,
    };
  }

  return {
    min,
    max,
  };
}

/**
 * Normalize search query
 */
function normalizeSearchQuery(query: unknown): string {
  if (typeof query !== "string") {
    return "";
  }
  return query.trim();
}

/**
 * Normalize tag filter array
 */
function normalizeTagFilter(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  // Filter out invalid values and ensure all are strings
  return tags.filter(
    (tag): tag is string => typeof tag === "string" && tag.length > 0
  );
}

/**
 * Normalize transaction type filter array
 */
function normalizeTransactionTypeFilter(types: unknown): string[] {
  if (!Array.isArray(types)) {
    return [];
  }
  // Filter out invalid values, only allow EXPENSE and INCOME
  const validTypes = ["EXPENSE", "INCOME"];
  return types.filter(
    (type): type is string =>
      typeof type === "string" && validTypes.includes(type)
  );
}

/**
 * Normalize payment method filter array
 */
function normalizePaymentMethodFilter(methods: unknown): string[] {
  if (!Array.isArray(methods)) {
    return [];
  }
  // Filter out invalid values and ensure all are strings
  return methods.filter(
    (method): method is string =>
      typeof method === "string" && method.length > 0
  );
}

/**
 * Normalize currency filter array
 */
function normalizeCurrencyFilter(currencies: unknown): string[] {
  if (!Array.isArray(currencies)) {
    return [];
  }
  // Filter out invalid values and ensure all are strings
  return currencies.filter(
    (currency): currency is string =>
      typeof currency === "string" && currency.length > 0
  );
}

/**
 * Normalize and validate a filter state.
 *
 * This ensures:
 * - All fields have valid types
 * - Conflicting values are resolved (e.g., min > max)
 * - Invalid values fall back to defaults
 * - The state is always in a valid, consistent form
 *
 * Note: This function may create new object references even when values
 * are semantically the same (e.g., trimming strings). Callers should
 * compare values semantically, not by reference.
 */
export function normalizeFilterState(
  state: Partial<ITransactionFilterState>
): ITransactionFilterState {
  const normalized: ITransactionFilterState = {
    dateFilter: normalizeDateFilter(
      state.dateFilter ?? DEFAULT_FILTER_STATE.dateFilter
    ),
    priceFilter: normalizePriceFilter(
      state.priceFilter ?? DEFAULT_FILTER_STATE.priceFilter
    ),
    searchQuery: normalizeSearchQuery(
      state.searchQuery ?? DEFAULT_FILTER_STATE.searchQuery
    ),
    tagFilter: normalizeTagFilter(
      state.tagFilter ?? DEFAULT_FILTER_STATE.tagFilter
    ),
    transactionTypeFilter: normalizeTransactionTypeFilter(
      state.transactionTypeFilter ?? DEFAULT_FILTER_STATE.transactionTypeFilter
    ),
    paymentMethodFilter: normalizePaymentMethodFilter(
      state.paymentMethodFilter ?? DEFAULT_FILTER_STATE.paymentMethodFilter
    ),
    currencyFilter: normalizeCurrencyFilter(
      state.currencyFilter ?? DEFAULT_FILTER_STATE.currencyFilter
    ),
  };

  return normalized;
}

/**
 * Check if two filter states are semantically equal (ignoring object references)
 */
export function areFilterStatesEqual(
  a: ITransactionFilterState,
  b: ITransactionFilterState
): boolean {
  // Compare date filters
  if (a.dateFilter.type !== b.dateFilter.type) return false;
  if (a.dateFilter.from !== b.dateFilter.from) return false;
  if (a.dateFilter.to !== b.dateFilter.to) return false;

  // Compare price filters
  if (a.priceFilter.min !== b.priceFilter.min) return false;
  if (a.priceFilter.max !== b.priceFilter.max) return false;

  // Compare search query (trimmed)
  if (a.searchQuery.trim() !== b.searchQuery.trim()) return false;

  // Compare tag filters
  if (a.tagFilter.length !== b.tagFilter.length) return false;
  const aTagsSorted = [...a.tagFilter].sort();
  const bTagsSorted = [...b.tagFilter].sort();
  for (let i = 0; i < aTagsSorted.length; i++) {
    if (aTagsSorted[i] !== bTagsSorted[i]) return false;
  }

  // Compare transaction type filters
  if (a.transactionTypeFilter.length !== b.transactionTypeFilter.length)
    return false;
  const aTypesSorted = [...a.transactionTypeFilter].sort();
  const bTypesSorted = [...b.transactionTypeFilter].sort();
  for (let i = 0; i < aTypesSorted.length; i++) {
    if (aTypesSorted[i] !== bTypesSorted[i]) return false;
  }

  // Compare payment method filters
  if (a.paymentMethodFilter.length !== b.paymentMethodFilter.length)
    return false;
  const aMethodsSorted = [...a.paymentMethodFilter].sort();
  const bMethodsSorted = [...b.paymentMethodFilter].sort();
  for (let i = 0; i < aMethodsSorted.length; i++) {
    if (aMethodsSorted[i] !== bMethodsSorted[i]) return false;
  }

  // Compare currency filters
  if (a.currencyFilter.length !== b.currencyFilter.length) return false;
  const aCurrenciesSorted = [...a.currencyFilter].sort();
  const bCurrenciesSorted = [...b.currencyFilter].sort();
  for (let i = 0; i < aCurrenciesSorted.length; i++) {
    if (aCurrenciesSorted[i] !== bCurrenciesSorted[i]) return false;
  }

  return true;
}

/**
 * Check if a filter state has any active (non-default) filters
 */
export function hasActiveFilters(
  state: ITransactionFilterState,
  defaultState: ITransactionFilterState = DEFAULT_FILTER_STATE
): boolean {
  // Check if transaction type filter is active (not empty and not both types)
  const hasTransactionTypeFilter =
    state.transactionTypeFilter.length > 0 &&
    state.transactionTypeFilter.length < 2;

  return (
    state.dateFilter.type !== defaultState.dateFilter.type ||
    state.priceFilter.min !== undefined ||
    state.priceFilter.max !== undefined ||
    state.searchQuery.trim() !== "" ||
    state.tagFilter.length > 0 ||
    hasTransactionTypeFilter ||
    state.paymentMethodFilter.length > 0 ||
    state.currencyFilter.length > 0
  );
}

/**
 * Serialize filter state to URL query parameters
 */
export function serializeFilterStateToQuery(
  state: ITransactionFilterState
): Record<string, string> {
  const params: Record<string, string> = {};

  // Date filter - always include to preserve state in URLs (for sharing/bookmarking)
  params.dateType = state.dateFilter.type;
  // Only include dateFrom/dateTo for custom date ranges (they can be recalculated for other types)
  if (state.dateFilter.type === "custom") {
    if (state.dateFilter.from) {
      params.dateFrom = state.dateFilter.from;
    }
    if (state.dateFilter.to) {
      params.dateTo = state.dateFilter.to;
    }
  }

  // Price filter
  if (state.priceFilter.min !== undefined) {
    params.priceMin = state.priceFilter.min.toString();
  }
  if (state.priceFilter.max !== undefined) {
    params.priceMax = state.priceFilter.max.toString();
  }

  // Search query - using 'q' to match API convention
  if (state.searchQuery.trim()) {
    params.q = state.searchQuery.trim();
  }

  // Tag filter
  if (state.tagFilter.length > 0) {
    params.tags = joinArrayForQuery(state.tagFilter);
  }

  // Transaction type filter (only serialize if not both types selected)
  if (
    state.transactionTypeFilter.length > 0 &&
    state.transactionTypeFilter.length < 2
  ) {
    params.transactionTypes = joinArrayForQuery(state.transactionTypeFilter);
  }

  // Payment method filter
  if (state.paymentMethodFilter.length > 0) {
    params.paymentMethods = joinArrayForQuery(state.paymentMethodFilter);
  }

  // Currency filter
  if (state.currencyFilter.length > 0) {
    params.currencies = joinArrayForQuery(state.currencyFilter);
  }

  return params;
}

/**
 * Deserialize filter state from URL query parameters
 */
export function deserializeFilterStateFromQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Partial<ITransactionFilterState> {
  const state: Partial<ITransactionFilterState> = {};

  // Handle both URLSearchParams and plain objects
  const getParam = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const value = params[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  // Date filter
  const dateType = getParam("dateType");
  if (
    dateType &&
    ["allTime", "thisMonth", "lastMonth", "custom"].includes(dateType)
  ) {
    const dateFrom = getParam("dateFrom");
    const dateTo = getParam("dateTo");
    state.dateFilter = {
      type: dateType as IDateFilter["type"],
      from: dateFrom,
      to: dateTo,
    };
  }

  // Price filter
  const priceMin = getParam("priceMin");
  const priceMax = getParam("priceMax");
  if (priceMin !== undefined || priceMax !== undefined) {
    state.priceFilter = {};
    if (priceMin !== undefined) {
      const min = parseFloat(priceMin);
      if (!isNaN(min) && isFinite(min)) {
        state.priceFilter.min = min;
      }
    }
    if (priceMax !== undefined) {
      const max = parseFloat(priceMax);
      if (!isNaN(max) && isFinite(max)) {
        state.priceFilter.max = max;
      }
    }
  }

  // Search query - check both 'q' (new) and 'search' (legacy) for backward compatibility
  const search = getParam("q") ?? getParam("search");
  if (search !== undefined) {
    state.searchQuery = search;
  }

  // Tag filter
  const tags = getParam("tags");
  if (tags !== undefined) {
    state.tagFilter = splitQueryToArray(tags);
  }

  // Transaction type filter
  const transactionTypes = getParam("transactionTypes");
  if (transactionTypes !== undefined) {
    state.transactionTypeFilter = splitQueryToArray(transactionTypes);
  }

  // Payment method filter
  const paymentMethods = getParam("paymentMethods");
  if (paymentMethods !== undefined) {
    state.paymentMethodFilter = splitQueryToArray(paymentMethods);
  }

  // Currency filter
  const currencies = getParam("currencies");
  if (currencies !== undefined) {
    state.currencyFilter = splitQueryToArray(currencies);
  }

  return state;
}

/**
 * Serialize filter state to JSON string (for localStorage, etc.)
 */
export function serializeFilterStateToJSON(
  state: ITransactionFilterState
): string {
  return JSON.stringify(state);
}

/**
 * Deserialize filter state from JSON string (for localStorage, etc.)
 */
export function deserializeFilterStateFromJSON(
  json: string
): Partial<ITransactionFilterState> {
  try {
    const parsed = JSON.parse(json);
    return parsed;
  } catch {
    // Return empty object on parse error - normalization will handle defaults
    return {};
  }
}
