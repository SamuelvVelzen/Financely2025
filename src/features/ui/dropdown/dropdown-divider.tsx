"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";

type IDropdownDividerProps = {} & IPropsWithClassName;

export function DropdownDivider({ className = "" }: IDropdownDividerProps) {
  return <div className={cn("border border-border", className)}></div>;
}
