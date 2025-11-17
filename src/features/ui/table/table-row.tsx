"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type TableRowProps = {
  rowIndex?: number;
} & PropsWithClassName &
  PropsWithChildren;

export function TableRow({ rowIndex, className, children }: TableRowProps) {
  return <tr className={cn(className)}>{children}</tr>;
}
