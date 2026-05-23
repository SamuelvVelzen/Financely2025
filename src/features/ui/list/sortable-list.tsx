import { ReactNode } from "react";
import { useSortableList } from "./hooks/use-sortable-list";
import { IListProps, List } from "./list";

export type ISortableListDragProps = {
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  isDragOver: boolean;
  isOriginalPosition: boolean;
  draggedItemHeight: number | null;
};

type ISortableListBaseProps<T> = Omit<IListProps<T>, "data" | "children"> & {
  data: T[];
  storageKey?: string;
  getItemId: (item: T) => string | number;
};

export type ISortableListDraggableProps<T> = ISortableListBaseProps<T> & {
  draggable?: true;
  onOrderChange?: (orderedIds: (string | number)[]) => void;
  children: (
    item: T,
    index: number,
    dragProps: ISortableListDragProps
  ) => ReactNode;
};

export type ISortableListStaticProps<T> = ISortableListBaseProps<T> & {
  draggable: false;
  onOrderChange?: never;
  children: (item: T, index: number) => ReactNode;
};

export type ISortableListProps<T> =
  | ISortableListDraggableProps<T>
  | ISortableListStaticProps<T>;

export function SortableList<T>(
  props: ISortableListDraggableProps<T>
): ReactNode;
export function SortableList<T>(props: ISortableListStaticProps<T>): ReactNode;
export function SortableList<T>({
  data,
  children,
  storageKey,
  getItemId,
  onOrderChange,
  draggable = true,
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
    onOrderChange: draggable ? onOrderChange : undefined,
  });

  if (!draggable) {
    const staticChildren = children as ISortableListStaticProps<T>["children"];
    return (
      <List data={data} className={className} getItemKey={getItemKey}>
        {(item, index) => staticChildren(item, index)}
      </List>
    );
  }

  const draggableChildren = children as ISortableListDraggableProps<T>["children"];

  return (
    <div
      onDragEnd={() => {
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

          const dragProps: ISortableListDragProps = {
            onDragStart: (e: React.DragEvent) => {
              handleDragStart(index);
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
            onDragEnd: () => {
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

          return draggableChildren(item, index, dragProps);
        }}
      </List>
    </div>
  );
}
