"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

type IListItemProps = {
  clicked?: () => void;
} & PropsWithChildren &
  IPropsWithClassName;

export function ListItem({
  children,
  className = "",
  clicked,
}: IListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 bg-surface hover:bg-surface-hover",
        className
      )}
      onClick={clicked}>
      {children}
    </div>
  );
}
