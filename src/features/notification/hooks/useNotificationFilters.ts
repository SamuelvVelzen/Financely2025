import { useCallback, useEffect, useRef, useState } from "react";
import type { INotificationType } from "@/features/shared/validation/enums";
import type { INotificationStatusFilter } from "../utils/notification-filter-query-schema";
import type { INotificationFilterState } from "../utils/notification-filter-model";
import {
  DEFAULT_NOTIFICATION_FILTER_STATE,
  hasActiveFilters as checkHasActiveFilters,
  normalizeFilterState,
} from "../utils/notification-filter-model";

export type { INotificationFilterState as IFilterState };

export type IUseNotificationFiltersOptions = {
  initialState?: Partial<INotificationFilterState>;
  onFilterChange?: (state: INotificationFilterState) => void;
};

export type IUseNotificationFiltersReturn = {
  filterState: INotificationFilterState;
  setFilterState: (state: Partial<INotificationFilterState>) => void;
  setStatus: (status: INotificationStatusFilter) => void;
  setType: (type: INotificationType | undefined) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
};

export function useNotificationFilters({
  initialState,
  onFilterChange,
}: IUseNotificationFiltersOptions = {}): IUseNotificationFiltersReturn {
  const [filterState, setFilterStateInternal] = useState(() =>
    normalizeFilterState(initialState ?? {}),
  );

  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  const applyState = useCallback((next: Partial<INotificationFilterState>) => {
    setFilterStateInternal((prev) => {
      const normalized = normalizeFilterState({ ...prev, ...next });
      onFilterChangeRef.current?.(normalized);
      return normalized;
    });
  }, []);

  const setFilterState = useCallback(
    (state: Partial<INotificationFilterState>) => {
      applyState(state);
    },
    [applyState],
  );

  const setStatus = useCallback(
    (status: INotificationStatusFilter) => {
      applyState({ status });
    },
    [applyState],
  );

  const setType = useCallback(
    (type: INotificationType | undefined) => {
      applyState({ type });
    },
    [applyState],
  );

  const clearAllFilters = useCallback(() => {
    applyState(DEFAULT_NOTIFICATION_FILTER_STATE);
  }, [applyState]);

  return {
    filterState,
    setFilterState,
    setStatus,
    setType,
    clearAllFilters,
    hasActiveFilters: checkHasActiveFilters(filterState),
  };
}
