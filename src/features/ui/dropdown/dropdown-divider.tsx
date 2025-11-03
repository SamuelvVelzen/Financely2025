"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";

type IDropdownDividerProps = {} & PropsWithClassName;

export function DropdownDivider({ className = "" }: IDropdownDividerProps) {
  return <div className={`border ${className}`}></div>;
}
