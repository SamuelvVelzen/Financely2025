"use client";

import { ReactNode } from "react";
import { useSortableList } from "./hooks/use-sortable-list";
import { IListProps, List } from "./list";

type ISortableListProps<T> = Omit<IListProps<T>, "data"> & {
  data: T[];
  storageKey?: string;
  getItemId: (item: T) => string | number;
  onOrderChange?: (orderedIds: (string | number)[]) => void;
  children: (
    item: T,
    index: number,
    dragProps: {
      onDragStart: (e: React.DragEvent) => void;
      onDragOver: (e: React.DragEvent) => void;
      onDragEnd: (e: React.DragEvent) => void;
      onDrop: (e: React.DragEvent) => void;
      isDragging: boolean;
    }
  ) => ReactNode;
};

export function SortableList<T>({
  data,
  children,
  storageKey,
  getItemId,
  onOrderChange,
  className,
  getItemKey,
}: ISortableListProps<T>) {
  const {
    orderedData,
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  } = useSortableList({
    data,
    getItemId,
    storageKey,
    onOrderChange,
  });

  return (
    <List data={orderedData} className={className} getItemKey={getItemKey}>
      {(item, index) => {
        const dragProps = {
          onDragStart: (e: React.DragEvent) => {
            handleDragStart(index);
          },
          onDragOver: (e: React.DragEvent) => {
            handleDragOver(e, index);
          },
          onDragEnd: (e: React.DragEvent) => {
            handleDragEnd();
          },
          onDrop: (e: React.DragEvent) => {
            handleDrop(e);
          },
          isDragging: draggedIndex === index,
        };

        return children(item, index, dragProps);
      }}
    </List>
  );
}
