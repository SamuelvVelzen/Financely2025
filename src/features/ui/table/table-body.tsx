"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type TableBodyProps = PropsWithClassName & PropsWithChildren;

export function TableBody({ className, children }: TableBodyProps) {
  return <tbody className={cn(className)}>{children}</tbody>;
}

TableBody.displayName = "TableBody";

