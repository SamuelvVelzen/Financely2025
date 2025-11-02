"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, createElement, type ElementType } from "react";

type IContainerProps = {
  as?: ElementType;
} & PropsWithChildren &
  PropsWithClassName;

export default function Container({
  children,
  className = "",
  as: Component = "div",
}: IContainerProps) {
  return createElement(
    Component,
    {
      className: "bg-surface border border-border rounded-2xl p-4 " + className,
    },
    children
  );
}
