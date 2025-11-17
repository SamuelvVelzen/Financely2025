"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, ReactNode } from "react";

type IDropdownItemProps = {
  text?: string;
  icon?: ReactNode;
  clicked?: () => void;
} & PropsWithChildren &
  IPropsWithClassName;

export function DropdownItem({
  className = "",
  children,
  text,
  icon,
  clicked,
}: IDropdownItemProps) {
  const content = children ? children : text;

  return (
    <div
      className={cn(
        "flex items-center gap-2 hover:bg-surface-hover p-2 text-nowrap",
        className
      )}
      onClick={clicked}>
      <span>{icon}</span> {content}
    </div>
  );
}
