"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, createElement, type ElementType } from "react";

type IContainerProps = {
  as?: ElementType;
} & PropsWithChildren &
  IPropsWithClassName;

export function Container({
  children,
  className = "",
  as: Component = "div",
}: IContainerProps) {
  return createElement(
    Component,
    {
      className: cn(
        "bg-surface border border-border rounded-2xl p-4",
        className
      ),
    },
    children
  );
}
