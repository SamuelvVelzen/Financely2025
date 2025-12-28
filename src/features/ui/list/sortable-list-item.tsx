"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  Children,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import { DragHandle } from "./drag-handle";
import { ListItem } from "./list-item";

type ISortableListItemProps = {
  draggable: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isOriginalPosition?: boolean;
  draggedItemHeight?: number | null;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  clicked?: () => void;
} & PropsWithChildren &
  IPropsWithClassName;

export function SortableListItem({
  children,
  className = "",
  clicked,
  draggable,
  isDragging = false,
  isDragOver = false,
  isOriginalPosition = false,
  draggedItemHeight = null,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: ISortableListItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const listItemRef = useRef<HTMLDivElement>(null);
  const [itemHeight, setItemHeight] = useState<number | null>(null);

  // Measure item height when mounted and when not dragging
  useEffect(() => {
    if (!isDragging && listItemRef.current) {
      const height = listItemRef.current.offsetHeight;
      if (height > 0) {
        setItemHeight(height);
      }
    }
  }, [isDragging]);

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");

    // Measure the full ListItem height (including padding)
    if (listItemRef.current) {
      const height = listItemRef.current.offsetHeight;
      setItemHeight(height);
      // Store in dataTransfer for access in SortableList
      e.dataTransfer.setData("text/height", height.toString());
    }

    onDragStart?.(e);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    onDragOver?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!draggable) return;
    // Always call onDragEnd to handle drops outside the container
    onDragEnd?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    onDrop?.(e);
  };

  const childrenArray = Children.toArray(children);
  const hasMultipleChildren = childrenArray.length > 1;

  // Use provided height or measured height
  const height = draggedItemHeight ?? itemHeight;

  // Show placeholder for original position when item is being dragged
  if (isOriginalPosition && isDragging) {
    return (
      <ListItem
        ref={listItemRef}
        className={cn(
          "opacity-30 border-2 border-dashed border-border rounded-2xl",
          className
        )}
        clicked={clicked}
        style={height ? { height: `${height}px` } : undefined}
        onDragOver={handleDragOver}
        onDrop={handleDrop}>
        <div className="flex items-center justify-between w-full h-full">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <DragHandle />
            </div>
            <div className="h-4 bg-surface-hover rounded-2xl w-32" />
          </div>
          <div className="h-4 bg-surface-hover rounded-2xl w-16" />
        </div>
      </ListItem>
    );
  }

  // Show drop zone indicator with preview of item content
  if (isDragOver && !isDragging) {
    return (
      <ListItem
        ref={listItemRef}
        className={cn(
          "border-2 border-dashed border-primary bg-primary/10 rounded-2xl shadow-md",
          draggable && "cursor-move",
          className
        )}
        clicked={clicked}
        style={height ? { height: `${height}px` } : undefined}
        onDragOver={handleDragOver}
        onDrop={handleDrop}>
        <div className="flex items-center justify-between w-full h-full opacity-60">
          {draggable ? (
            <>
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <DragHandle />
                </div>
                {hasMultipleChildren ? childrenArray[0] : children}
              </div>
              {hasMultipleChildren && childrenArray.length > 1 && (
                <div>{childrenArray.slice(1)}</div>
              )}
            </>
          ) : (
            children
          )}
        </div>
      </ListItem>
    );
  }

  return (
    <ListItem
      ref={listItemRef}
      className={cn(
        draggable && "cursor-move",
        isDragging &&
          "opacity-50 scale-105 shadow-lg border-2 border-primary rounded-2xl z-50",
        className
      )}
      clicked={clicked}>
      <div
        ref={itemRef}
        className="flex items-center justify-between w-full"
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}>
        {draggable ? (
          <>
            <div className="flex items-center gap-3">
              <div
                className="shrink-0"
                draggable={false}>
                <DragHandle />
              </div>
              {hasMultipleChildren ? childrenArray[0] : children}
            </div>
            {hasMultipleChildren && childrenArray.length > 1 && (
              <div>{childrenArray.slice(1)}</div>
            )}
          </>
        ) : (
          children
        )}
      </div>
    </ListItem>
  );
}
