import { useCallback, useEffect, useMemo, useState } from "react";

export function useBulkSelection<TId extends string>(visibleIds: readonly TId[]) {
  const [selectedKeys, setSelectedKeys] = useState<Set<TId>>(() => new Set());

  useEffect(() => {
    const visible = new Set(visibleIds);
    setSelectedKeys((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)));
      if (next.size === prev.size) {
        return prev;
      }
      return next;
    });
  }, [visibleIds]);

  const selectedCount = selectedKeys.size;

  const toggle = useCallback((id: TId) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (id: TId) => selectedKeys.has(id),
    [selectedKeys],
  );

  const clear = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedKeys(new Set(visibleIds));
  }, [visibleIds]);

  const replaceSelection = useCallback((next: Set<TId>) => {
    setSelectedKeys(new Set(next));
  }, []);

  const allVisibleSelected = useMemo(() => {
    if (visibleIds.length === 0) {
      return false;
    }
    return visibleIds.every((id) => selectedKeys.has(id));
  }, [visibleIds, selectedKeys]);

  const someVisibleSelected = useMemo(() => {
    if (visibleIds.length === 0) {
      return false;
    }
    const count = visibleIds.filter((id) => selectedKeys.has(id)).length;
    return count > 0 && count < visibleIds.length;
  }, [visibleIds, selectedKeys]);

  const selectedKeyList = useMemo(() => [...selectedKeys], [selectedKeys]);

  return {
    selectedKeys,
    selectedKeyList,
    selectedCount,
    toggle,
    isSelected,
    clear,
    selectAllVisible,
    replaceSelection,
    onSelectionChange: replaceSelection,
    allVisibleSelected,
    someVisibleSelected,
  };
}