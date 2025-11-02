"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, ReactNode } from "react";

type IDropdownItemProps = {
  text?: string;
  icon?: ReactNode;
} & PropsWithChildren &
  PropsWithClassName;

export default function DropdownItem({
  className = "",
  children,
  text,
  icon,
}: IDropdownItemProps) {
  const content = children ? children : text;

  return (
    <div
      className={`flex items-center gap-2 hover:bg-surface-hover p-2 text-nowrap ${className}`}>
      <span>{icon}</span> {content}
    </div>
  );
}
