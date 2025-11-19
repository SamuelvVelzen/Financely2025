"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { ReactNode } from "react";

type IListProps<T> = {
  data: T[];
  children: (item: T, index: number) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
} & IPropsWithClassName;

export function List<T>({
  data,
  children,
  className = "",
  getItemKey,
}: IListProps<T>) {
  if (data.length === 0) {
    return null;
  }

  const getKey = (item: T, index: number): string | number => {
    if (getItemKey) {
      return getItemKey(item, index);
    }
    // Try to get id property if it exists
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      (typeof (item as { id?: unknown }).id === "string" ||
        typeof (item as { id?: unknown }).id === "number")
    ) {
      return (item as { id: string | number }).id;
    }
    // Fallback to index
    return index;
  };

  return (
    <div
      className={cn(
        "divide-y divide-border rounded-2xl overflow-hidden",
        className
      )}>
      {data.map((item, index) => (
        <div key={getKey(item, index)}>{children(item, index)}</div>
      ))}
    </div>
  );
}
