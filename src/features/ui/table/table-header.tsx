"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type TableHeaderProps = PropsWithClassName & PropsWithChildren;

export function TableHeader({ className, children }: TableHeaderProps) {
  return (
    <thead className={cn("bg-surface-hover", className)}>{children}</thead>
  );
}

TableHeader.displayName = "TableHeader";

