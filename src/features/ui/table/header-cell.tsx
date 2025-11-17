"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type HeaderCellProps = {
  align?: "left" | "right" | "center";
} & PropsWithClassName &
  PropsWithChildren;

export function HeaderCell({
  align = "left",
  className,
  children,
}: HeaderCellProps) {
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
