"use client";

import { useEffect, useMemo, useState } from "react";

type UseOptimisticDataOptions<T> = {
  /**
   * The source data from the server/query
   */
  data: T;
  /**
   * Optional comparison function to determine if data matches optimistic data
   * If not provided, uses shallow equality (===)
   * If returns true, optimistic data will be cleared
   */
  isEqual?: (source: T, optimistic: T) => boolean;
  /**
   * Optional callback when optimistic data is cleared
   */
  onCleared?: () => void;
};

/**
 * Hook for managing optimistic data updates
 *
 * @example
 * ```tsx
 * const { data, setOptimistic, revert, clear } = useOptimisticData({
 *   data: serverData,
 *   isEqual: (source, optimistic) =>
 *     JSON.stringify(source) === JSON.stringify(optimistic)
 * });
 *
 * // Apply optimistic update
 * setOptimistic(newData);
 *
 * // Revert on error
 * revert();
 *
 * // Manually clear
 * clear();
 * ```
 */
export function useOptimisticData<T>({
  data,
  isEqual,
  onCleared,
}: UseOptimisticDataOptions<T>) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);

  // Use optimistic data if available, otherwise use source data
  const currentData = useMemo(() => {
    return optimisticData ?? data;
  }, [data, optimisticData]);

  // Clear optimistic data when source data matches optimistic data
  useEffect(() => {
    if (optimisticData !== null) {
      const matches = isEqual
        ? isEqual(data, optimisticData)
        : data === optimisticData;

      if (matches) {
        setOptimisticData(null);
        onCleared?.();
      }
    }
  }, [data, optimisticData, isEqual, onCleared]);

  /**
   * Set optimistic data
   */
  const setOptimistic = (newData: T) => {
    setOptimisticData(newData);
  };

  /**
   * Revert to source data (clear optimistic data)
   */
  const revert = () => {
    setOptimisticData(null);
  };

  /**
   * Clear optimistic data (alias for revert)
   */
  const clear = () => {
    setOptimisticData(null);
  };

  return {
    /**
     * Current data (optimistic if set, otherwise source)
     */
    data: currentData,
    /**
     * Whether optimistic data is currently active
     */
    isOptimistic: optimisticData !== null,
    /**
     * The optimistic data value (null if not set)
     */
    optimisticData,
    /**
     * Set optimistic data
     */
    setOptimistic,
    /**
     * Revert to source data
     */
    revert,
    /**
     * Clear optimistic data (alias for revert)
     */
    clear,
  };
}
