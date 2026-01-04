import { useOptimisticData } from "@/features/shared/hooks/use-optimistic-data";
import { useState } from "react";

type UseSortableListOptions<T> = {
  data: T[];
  getItemId: (item: T) => string | number;
  storageKey?: string;
  onOrderChange?: (orderedIds: (string | number)[]) => void;
};

export function useSortableList<T>({
  data,
  getItemId,
  storageKey,
  onOrderChange,
}: UseSortableListOptions<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedItemHeight, setDraggedItemHeight] = useState<number | null>(
    null
  );

  // Use optimistic data hook for managing optimistic updates
  const {
    data: orderedData,
    setOptimistic: setOptimisticData,
    revert: revertOptimistic,
    clear: clearOptimistic,
    optimisticData,
  } = useOptimisticData<T[]>({
    data,
    isEqual: (source, optimistic) => {
      // Check if data matches optimistic order by comparing IDs
      if (source.length !== optimistic.length) return false;
      const sourceIds = source.map((item) => getItemId(item));
      const optimisticIds = optimistic.map((item) => getItemId(item));
      return sourceIds.every((id, index) => id === optimisticIds[index]);
    },
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const setDraggedItemHeightFromEvent = (height: number) => {
    setDraggedItemHeight(height);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    // If we have a valid drag operation, complete it even if dropped outside
    if (draggedIndex !== null) {
      // If dragOverIndex is null, it means we dropped outside, so reset
      if (dragOverIndex === null) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        setDraggedItemHeight(null);
        return;
      }

      // Reorder the data array optimistically
      const currentData = orderedData;
      const newOrderedData = [...currentData];
      const [draggedItem] = newOrderedData.splice(draggedIndex, 1);
      newOrderedData.splice(dragOverIndex, 0, draggedItem);

      // Apply optimistic update immediately
      setOptimisticData(newOrderedData);

      // Extract IDs in new order and call callback
      const newOrder = newOrderedData.map((item) => getItemId(item));
      onOrderChange?.(newOrder);
    }

    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedItemHeight(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragEnd();
  };

  return {
    orderedData,
    draggedIndex,
    dragOverIndex,
    optimisticData,
    draggedItemHeight,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    setDraggedItemHeightFromEvent,
    revertOptimistic,
    clearOptimistic,
  };
}
