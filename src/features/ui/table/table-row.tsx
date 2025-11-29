"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type ITableRowProps = {
  rowIndex?: number;
} & IPropsWithClassName &
  PropsWithChildren;

export function TableRow({ rowIndex, className, children }: ITableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border hover:bg-surface-hover motion-safe:transition-colors last:border-b-0",
        className
      )}
    >
      {children}
    </tr>
  );
}
