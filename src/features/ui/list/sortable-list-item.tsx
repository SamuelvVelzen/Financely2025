"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { Children, PropsWithChildren } from "react";
import { DragHandle } from "./drag-handle";
import { ListItem } from "./list-item";

type ISortableListItemProps = {
  draggable: boolean;
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
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: ISortableListItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
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

  return (
    <ListItem
      className={cn(draggable && "cursor-move", className)}
      clicked={clicked}
    >
      <div
        className="flex items-center justify-between w-full"
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
      >
        {draggable ? (
          <>
            <div className="flex items-center gap-3">
              <div className="shrink-0" draggable={false}>
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
