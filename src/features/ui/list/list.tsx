import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { Children, ReactNode } from "react";

// Data-driven mode: pass data array and render function
type IListPropsWithData<T> = {
  data: T[];
  children: (item: T, index: number) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
} & IPropsWithClassName;

// Static mode: just pass children directly (no data)
type IListPropsStatic = {
  data?: undefined;
  children: ReactNode;
  getItemKey?: never;
} & IPropsWithClassName;

export type IListProps<T> = IListPropsWithData<T> | IListPropsStatic;

function isDataDriven<T>(
  props: IListProps<T>
): props is IListPropsWithData<T> {
  return props.data !== undefined;
}

export function List<T>(props: IListProps<T>) {
  const { className = "" } = props;

  // Static mode - render children directly
  if (!isDataDriven(props)) {
    const { children } = props;
    return (
      <ul
        className={cn("overflow-hidden list-none", className)}
        role="list">
        {Children.map(children, (child, index) => (
          <li key={index}>{child}</li>
        ))}
      </ul>
    );
  }

  // Data-driven mode
  const { data, children, getItemKey } = props;

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
