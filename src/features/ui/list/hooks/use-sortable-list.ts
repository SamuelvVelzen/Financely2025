"use client";

import { useEffect, useMemo, useState } from "react";

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

  // Data is already ordered by the database (tags have order property)
  // So we just use the data as-is
  const orderedData = useMemo(() => {
    return data;
  }, [data]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the data array
    const newOrderedData = [...orderedData];
    const [draggedItem] = newOrderedData.splice(draggedIndex, 1);
    newOrderedData.splice(dragOverIndex, 0, draggedItem);

    // Extract IDs in new order and call callback
    const newOrder = newOrderedData.map((item) => getItemId(item));
    onOrderChange?.(newOrder);

    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
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
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  };
}

