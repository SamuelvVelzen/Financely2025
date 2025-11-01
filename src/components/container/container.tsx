"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, createElement } from "react";

type IContainerProps = {
  as?: keyof React.JSX.IntrinsicElements;
} & PropsWithChildren &
  PropsWithClassName;

export default function Container({
  children,
  className = "",
  as = "div",
}: IContainerProps) {
  return createElement(
    as as string,
    {
      className: "bg-surface border border-border rounded-2xl p-4 " + className,
    },
    children
  );
}
