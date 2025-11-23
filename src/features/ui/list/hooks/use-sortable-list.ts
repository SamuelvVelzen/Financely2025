"use client";

import { useEffect, useMemo, useState } from "react";

type UseSortableListOptions<T> = {
  data: T[];
  getItemId: (item: T) => string | number;
  storageKey: string;
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
  const [currentOrder, setCurrentOrder] = useState<(string | number)[] | null>(
    null
  );

  // Load saved order from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as (string | number)[];
        setCurrentOrder(parsed);
      }
    } catch (error) {
      console.error("Failed to load saved order from localStorage:", error);
    }
  }, [storageKey]);

  // Create ordered data array
  const orderedData = useMemo(() => {
    if (!currentOrder || currentOrder.length === 0) {
      return data;
    }

    // Create a map of items by ID for quick lookup
    const itemMap = new Map<string | number, T>();
    data.forEach((item) => {
      const id = getItemId(item);
      itemMap.set(id, item);
    });

    // Build ordered array from current order
    const ordered: T[] = [];
    const processedIds = new Set<string | number>();

    // Add items in current order
    currentOrder.forEach((id) => {
      const item = itemMap.get(id);
      if (item) {
        ordered.push(item);
        processedIds.add(id);
      }
    });

    // Add any new items that weren't in current order (append to end)
    data.forEach((item) => {
      const id = getItemId(item);
      if (!processedIds.has(id)) {
        ordered.push(item);
      }
    });

    return ordered;
  }, [data, currentOrder, getItemId]);

  // Save order to localStorage
  const saveOrder = (order: (string | number)[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(order));
    } catch (error) {
      console.error("Failed to save order to localStorage:", error);
    }
  };

  // Update order when data changes (add new items to end)
  useEffect(() => {
    if (!currentOrder) {
      // If no saved order, create initial order from current data
      const initialOrder = data.map((item) => getItemId(item));
      setCurrentOrder(initialOrder);
      saveOrder(initialOrder);
      return;
    }

    // Check if there are new items
    const currentIds = new Set(data.map((item) => getItemId(item)));
    const orderIds = new Set(currentOrder);

    // Find new items
    const newIds = Array.from(currentIds).filter((id) => !orderIds.has(id));

    if (newIds.length > 0) {
      // Append new items to the end
      const updatedOrder = [...currentOrder, ...newIds];
      setCurrentOrder(updatedOrder);
      saveOrder(updatedOrder);
      onOrderChange?.(updatedOrder);
    }
  }, [data, currentOrder, getItemId, storageKey, onOrderChange]);

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

    // Reorder the order array
    const orderToUse = currentOrder || orderedData.map((item) => getItemId(item));
    const newOrder = [...orderToUse];
    const [draggedId] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dragOverIndex, 0, draggedId);

    // Update state and localStorage
    setCurrentOrder(newOrder);
    saveOrder(newOrder);
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

