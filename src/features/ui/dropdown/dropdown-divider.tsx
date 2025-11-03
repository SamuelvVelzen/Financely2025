"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";

type IDropdownDividerProps = {} & PropsWithClassName;

export function DropdownDivider({ className = "" }: IDropdownDividerProps) {
  return <div className={cn("border", className)}></div>;
}
