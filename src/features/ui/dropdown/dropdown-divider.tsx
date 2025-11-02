"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";

type IDropdownDividerProps = {} & PropsWithClassName;

export default function DropdownDivider({
  className = "",
}: IDropdownDividerProps) {
  return <div className={`border ${className}`}></div>;
}
