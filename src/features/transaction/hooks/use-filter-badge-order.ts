import { useEffect, useRef, useState } from "react";
import {
  collectFilterBadgeIds,
  isFilterBadgeValueChanged,
} from "../utils/filter-badge-order";
import {
  DEFAULT_FILTER_STATE,
  type ITransactionFilterState,
} from "../utils/transaction-filter-model";

export function useFilterBadgeOrder(
  filterState: ITransactionFilterState,
  defaultFilterState: ITransactionFilterState = DEFAULT_FILTER_STATE
): string[] {
  const previousFilterStateRef = useRef(filterState);
  const [badgeOrder, setBadgeOrder] = useState<string[]>([]);

  useEffect(() => {
    const previous = previousFilterStateRef.current;
    const currentIds = collectFilterBadgeIds(filterState, defaultFilterState);
    const previousIds = new Set(
      collectFilterBadgeIds(previous, defaultFilterState)
    );
    const currentIdSet = new Set(currentIds);

    const movedToFront: string[] = [];

    for (const id of currentIds) {
      if (!previousIds.has(id)) {
        movedToFront.push(id);
      } else if (
        isFilterBadgeValueChanged(previous, filterState, id)
      ) {
        movedToFront.push(id);
      }
    }

    setBadgeOrder((previousOrder) => {
      const kept = previousOrder.filter(
        (id) => currentIdSet.has(id) && !movedToFront.includes(id)
      );
      const ordered = new Set([...movedToFront, ...kept]);
      const appended = currentIds.filter((id) => !ordered.has(id));
      return [...movedToFront, ...kept, ...appended];
    });

    previousFilterStateRef.current = filterState;
  }, [filterState, defaultFilterState]);

  return badgeOrder;
}

export { DEFAULT_FILTER_STATE };
