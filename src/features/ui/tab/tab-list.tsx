"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";

type ITabListProps = IPropsWithClassName & PropsWithChildren & {};

export function TabList({ children, className = "" }: ITabListProps) {
  return (
    <div
      role="tablist"
      className={cn("flex w-full border-b border-border", className)}>
      {children}
    </div>
  );
}

TabList.displayName = "TabList";
