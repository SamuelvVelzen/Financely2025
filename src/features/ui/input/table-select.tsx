"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import React from "react";

export type TableSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> &
  PropsWithClassName;

export function TableSelect({
  className,
  children,
  ...props
}: TableSelectProps) {
  return (
    <select
      className={cn(
        "w-full px-2 py-1 border border-border rounded text-sm",
        className
      )}
      {...props}>
      {children}
    </select>
  );
}
