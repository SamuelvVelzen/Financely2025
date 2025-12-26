"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren, useRef } from "react";
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
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={contentRef}
      role="tabpanel"
      id={panelId}
      aria-labelledby={triggerId}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "absolute inset-x-0 top-0 py-4 transition-opacity duration-300 ease-in-out",
        className
      )}
      style={{
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
      }}>
      {children}
    </div>
  );
}

TabContent.displayName = "TabContent";
