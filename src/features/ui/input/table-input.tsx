"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import React from "react";

export type TableInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
> &
  PropsWithClassName;

export function TableInput({ className, ...props }: TableInputProps) {
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
