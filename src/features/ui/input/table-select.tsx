"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import React from "react";

export type ITableSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> &
  IPropsWithClassName;

export function TableSelect({
  className,
  children,
  ...props
}: ITableSelectProps) {
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
