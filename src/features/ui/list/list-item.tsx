"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { forwardRef, PropsWithChildren } from "react";

type IListItemProps = {
  clicked?: () => void;
  style?: React.CSSProperties;
} & PropsWithChildren &
  IPropsWithClassName &
  React.HTMLAttributes<HTMLDivElement>;

export const ListItem = forwardRef<HTMLDivElement, IListItemProps>(
  ({ children, className = "", clicked, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between p-3 bg-surface hover:bg-surface-hover",
          // Left/right borders for container
          "border-l border-r border-border",
          // First item: top border and rounded top corners (using CSS :first-child)
          "[li:first-child_&]:rounded-t-2xl [li:first-child_&]:border-t",
          // Last item: bottom border and rounded bottom corners (using CSS :last-child)
          "[li:last-child_&]:rounded-b-2xl [li:last-child_&]:border-b",
          // Dividers between items (not first)
          "[li:not(:first-child)_&]:border-t [li:not(:first-child)_&]:border-border",
          clicked && "cursor-pointer",
          className
        )}
        onClick={clicked}
        style={style}
        {...props}>
        {children}
      </div>
    );
  }
);

ListItem.displayName = "ListItem";
