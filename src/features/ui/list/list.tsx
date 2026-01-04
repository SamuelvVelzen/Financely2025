import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { ReactNode } from "react";

export type IListProps<T> = {
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
    <ul
      className={cn("overflow-hidden list-none", className)}
      role="list">
      {data.map((item, index) => {
        const child = children(item, index);
        return <li key={getKey(item, index)}>{child}</li>;
      })}
    </ul>
  );
}
