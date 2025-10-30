"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

type IContainerProps = {} & PropsWithChildren & PropsWithClassName;

export default function Container({
  children,
  className = "",
}: IContainerProps) {
  return (
    <div
      className={
        "bg-surface border border-border rounded-2xl p-4 " + className
      }>
      {children}
    </div>
  );
}
