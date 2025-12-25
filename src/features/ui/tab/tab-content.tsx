"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";
import { useTabContext } from "./tab-context";

type ITabContentProps = IPropsWithClassName &
  PropsWithChildren & {
    value: string;
  };

export function TabContent({
  value,
  children,
  className = "",
}: ITabContentProps) {
  const { value: activeValue, id } = useTabContext();
  const isActive = activeValue === value;
  const triggerId = `${id}-trigger-${value}`;
  const panelId = `${id}-panel-${value}`;

  if (!isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={triggerId}
      data-state={isActive ? "active" : "inactive"}
      className={cn("py-4", className)}>
      {children}
    </div>
  );
}
