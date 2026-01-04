import { ReactNode } from "react";
import { useSortableList } from "./hooks/use-sortable-list";
import { IListProps, List } from "./list";

type ISortableListProps<T> = Omit<IListProps<T>, "data" | "children"> & {
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
      isDragOver: boolean;
      isOriginalPosition: boolean;
      draggedItemHeight: number | null;
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
    draggedItemHeight,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    setDraggedItemHeightFromEvent,
  } = useSortableList({
    data,
    getItemId,
    storageKey,
    onOrderChange,
  });

  return (
    <div
      onDragEnd={(e) => {
        // Handle drops outside the container
        if (draggedIndex !== null) {
          handleDragEnd();
        }
      }}>
      <List
        data={orderedData}
        className={className}
        getItemKey={getItemKey}>
        {(item, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          const isOriginalPosition = draggedIndex === index;

          const dragProps = {
            onDragStart: (e: React.DragEvent) => {
              handleDragStart(index);
              // Get height from dataTransfer if available
              const heightStr = e.dataTransfer.getData("text/height");
              if (heightStr) {
                const height = parseInt(heightStr, 10);
                if (!isNaN(height)) {
                  setDraggedItemHeightFromEvent(height);
                }
              }
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
            isDragging,
            isDragOver,
            isOriginalPosition,
            draggedItemHeight,
          };

          return children(item, index, dragProps);
        }}
      </List>
    </div>
  );
}
