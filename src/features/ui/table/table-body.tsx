"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type ITableBodyProps = IPropsWithClassName & PropsWithChildren;

export function TableBody({ className, children }: ITableBodyProps) {
  return <tbody className={cn(className)}>{children}</tbody>;
}

TableBody.displayName = "TableBody";

