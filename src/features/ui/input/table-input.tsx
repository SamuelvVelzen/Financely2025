"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import React from "react";

export type ITableInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
> &
  IPropsWithClassName;

export function TableInput({ className, ...props }: ITableInputProps) {
  return (
    <input
      className={cn(
        "w-full px-2 py-1 border border-border rounded text-sm",
        className
      )}
      {...props}
    />
  );
}
