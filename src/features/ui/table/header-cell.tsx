"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IHeaderCellProps = {
  align?: "left" | "right" | "center";
} & IPropsWithClassName &
  PropsWithChildren;

export function HeaderCell({
  align = "left",
  className,
  children,
}: IHeaderCellProps) {
  const alignClasses = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  };

  return (
    <th className={cn("px-4 py-2", alignClasses[align], className)}>
      {children}
    </th>
  );
}
