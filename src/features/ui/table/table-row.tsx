"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type ITableRowProps = {
  rowIndex?: number;
} & IPropsWithClassName &
  PropsWithChildren;

export function TableRow({ rowIndex, className, children }: ITableRowProps) {
  return <tr className={cn(className)}>{children}</tr>;
}
