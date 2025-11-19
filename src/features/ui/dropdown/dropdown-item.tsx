"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, ReactNode } from "react";

type IDropdownItemProps = {
  text?: string;
  icon?: ReactNode;
  clicked?: () => void;
  selected?: boolean;
} & PropsWithChildren &
  IPropsWithClassName;

export function DropdownItem({
  className = "",
  children,
  text,
  icon,
  clicked,
  selected = false,
}: IDropdownItemProps) {
  const content = children ? children : text;

  return (
    <div
      className={cn(
        "flex items-center gap-2 hover:bg-surface-hover px-3 py-2 text-nowrap",
        selected && "bg-primary/10 text-primary font-medium",
        className
      )}
      onClick={clicked}>
      {icon && <span>{icon}</span>} {content}
    </div>
  );
}
