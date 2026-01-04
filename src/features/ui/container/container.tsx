import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  PropsWithChildren,
  createElement,
  type CSSProperties,
  type ElementType,
} from "react";

type IContainerProps = {
  as?: ElementType;
  style?: CSSProperties;
} & PropsWithChildren &
  IPropsWithClassName;

export function Container({
  children,
  className = "",
  as: Component = "div",
  style,
}: IContainerProps) {
  return createElement(
    Component,
    {
      className: cn(
        "bg-surface border border-border rounded-2xl p-4 shadow-lg mb-4",
        className
      ),
      style,
    },
    children
  );
}
