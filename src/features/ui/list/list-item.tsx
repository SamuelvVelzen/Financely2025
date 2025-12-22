"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { forwardRef, PropsWithChildren } from "react";

type IListItemProps = {
  clicked?: () => void;
  style?: React.CSSProperties;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
} & PropsWithChildren &
  IPropsWithClassName;

export const ListItem = forwardRef<HTMLDivElement, IListItemProps>(
  ({ children, className = "", clicked, style, onDragOver, onDrop }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between p-3 bg-surface hover:bg-surface-hover",
          className
        )}
        onClick={clicked}
        style={style}
        onDragOver={onDragOver}
        onDrop={onDrop}>
        {children}
      </div>
    );
  }
);

ListItem.displayName = "ListItem";
