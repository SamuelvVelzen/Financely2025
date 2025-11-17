"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";

type IDropdownDividerProps = {} & IPropsWithClassName;

export function DropdownDivider({ className = "" }: IDropdownDividerProps) {
  return <div className={cn("border border-border", className)}></div>;
}
