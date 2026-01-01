"use client";

import { useFinForm } from "@/features/ui/form/useForm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ITransactionFilterState } from "../utils/transaction-filter-model";
import {
  hasActiveFilters as checkHasActiveFilters,
  DEFAULT_FILTER_STATE,
  normalizeFilterState,
} from "../utils/transaction-filter-model";

/**
 * Re-export the filter state type for convenience
 */
export type { ITransactionFilterState as IFilterState };

/**
 * Options for useTransactionFilters hook
 */
export interface IUseTransactionFiltersOptions {
  /**
   * Initial filter state (will be normalized)
   */
  initialState?: Partial<ITransactionFilterState>;

  /**
   * Callback invoked when filter state changes
   * Useful for controlled component pattern or side effects
   */
  onFilterChange?: (state: ITransactionFilterState) => void;
}

/**
 * Form values type for the filter form
 */
export interface IFilterFormValues {
  searchQuery: string;
  tagFilter: string[];
}

/**
 * Return type for useTransactionFilters hook
 */
export interface IUseTransactionFiltersReturn {
  /**
   * Current normalized filter state
   */
  filterState: ITransactionFilterState;

  /**
   * Form instance for filter inputs (searchQuery, tagFilter)
   * This is the single source of truth for form values
   */
  form: UseFormReturn<IFilterFormValues>;

  /**
   * Update the entire filter state (controlled component pattern)
   * The state will be normalized before being applied
   */
  setFilterState: (state: Partial<ITransactionFilterState>) => void;

  /**
   * Individual field setters (for convenience)
   * These are stable references and will normalize values
   */
  setDateFilter: (filter: ITransactionFilterState["dateFilter"]) => void;
  setPriceFilter: (filter: ITransactionFilterState["priceFilter"]) => void;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tags: string[]) => void;

  /**
   * Reset all filters to default state
   */
  clearAllFilters: () => void;

  /**
   * Whether any filters are active (non-default)
   */
  hasActiveFilters: boolean;

  /**
   * Default filter state (for comparison/reset)
   */
  defaultFilterState: ITransactionFilterState;
}

/**
 * Hook for managing transaction filter state.
 *
 * Features:
 * - Normalized, validated state
 * - Stable handler references (useCallback)
 * - Controlled component pattern support
 * - Consistent behavior across routes
 * - Type-safe updates
 *
 * @param options Configuration options
 * @returns Filter state and update handlers
 */
export function useTransactionFilters(
  options?: IUseTransactionFiltersOptions
): IUseTransactionFiltersReturn {
  const { initialState, onFilterChange } = options ?? {};

  // Initialize state with normalization
  const [filterState, setFilterStateInternal] =
    useState<ITransactionFilterState>(() => {
      const normalized = normalizeFilterState(initialState ?? {});
      return normalized;
    });

  // Create form instance - single source of truth for form values
  const form = useFinForm<IFilterFormValues>({
    defaultValues: {
      searchQuery: filterState.searchQuery,
      tagFilter: filterState.tagFilter,
    },
  });

  // Keep refs of latest filterState values to avoid circular updates
  const searchQueryRef = useRef(filterState.searchQuery);
  const tagFilterRef = useRef(filterState.tagFilter);
  searchQueryRef.current = filterState.searchQuery;
  tagFilterRef.current = filterState.tagFilter;

  // Sync form changes to filterState (when user types/selects)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "searchQuery") {
        const formValue = value.searchQuery ?? "";
        // Only update filterState if form value differs from current state (user input)
        if (formValue !== searchQueryRef.current) {
          setFilterStateInternal((current) => {
            const updated = { ...current, searchQuery: formValue };
            const normalized = normalizeFilterState(updated);
            onFilterChange?.(normalized);
            return normalized;
          });
        }
      }
      if (name === "tagFilter") {
        const formValue = (value.tagFilter ?? []).filter(
          (v): v is string => v !== undefined
        );
        const formValueStr = JSON.stringify([...formValue].sort());
        const tagFilterStr = JSON.stringify([...tagFilterRef.current].sort());
        // Only update filterState if form value differs from current state (user input)
        if (formValueStr !== tagFilterStr) {
          setFilterStateInternal((current) => {
            const updated = { ...current, tagFilter: formValue };
            const normalized = normalizeFilterState(updated);
            onFilterChange?.(normalized);
            return normalized;
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onFilterChange]);

  // Sync filterState changes to form (for clearAll, external updates, etc.)
  useEffect(() => {
    const currentFormSearchQuery = form.getValues("searchQuery") ?? "";
    if (filterState.searchQuery !== currentFormSearchQuery) {
      form.setValue("searchQuery", filterState.searchQuery, {
        shouldDirty: false,
      });
    }
  }, [filterState.searchQuery, form]);

  useEffect(() => {
    const currentFormTagFilter = form.getValues("tagFilter") ?? [];
    const currentFormTagFilterStr = JSON.stringify(
      [...currentFormTagFilter].sort()
    );
    const tagFilterStr = JSON.stringify([...filterState.tagFilter].sort());
    if (tagFilterStr !== currentFormTagFilterStr) {
      form.setValue("tagFilter", filterState.tagFilter, {
        shouldDirty: false,
      });
    }
  }, [filterState.tagFilter, form]);

  // Update filter state with normalization
  const setFilterState = useCallback(
    (updates: Partial<ITransactionFilterState>) => {
      setFilterStateInternal((current) => {
        const merged = { ...current, ...updates };
        const normalized = normalizeFilterState(merged);

        // Invoke callback if provided
        onFilterChange?.(normalized);

        return normalized;
      });
    },
    [onFilterChange]
  );

  // Individual field setters (stable references)
  const setDateFilter = useCallback(
    (filter: ITransactionFilterState["dateFilter"]) => {
      setFilterState({ dateFilter: filter });
    },
    [setFilterState]
  );

  const setPriceFilter = useCallback(
    (filter: ITransactionFilterState["priceFilter"]) => {
      setFilterState({ priceFilter: filter });
    },
    [setFilterState]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      setFilterState({ searchQuery: query });
    },
    [setFilterState]
  );

  const setTagFilter = useCallback(
    (tags: string[]) => {
      setFilterState({ tagFilter: tags });
    },
    [setFilterState]
  );

  // Reset to defaults
  const clearAllFilters = useCallback(() => {
    setFilterStateInternal(DEFAULT_FILTER_STATE);
    form.setValue("searchQuery", DEFAULT_FILTER_STATE.searchQuery, {
      shouldDirty: false,
    });
    form.setValue("tagFilter", DEFAULT_FILTER_STATE.tagFilter, {
      shouldDirty: false,
    });
    onFilterChange?.(DEFAULT_FILTER_STATE);
  }, [form, onFilterChange]);

  // Check if any filters are active
  const hasActiveFiltersValue = useMemo(
    () => checkHasActiveFilters(filterState),
    [filterState]
  );

  return {
    filterState,
    form,
    setFilterState,
    setDateFilter,
    setPriceFilter,
    setSearchQuery,
    setTagFilter,
    clearAllFilters,
    hasActiveFilters: hasActiveFiltersValue,
    defaultFilterState: DEFAULT_FILTER_STATE,
  };
}
