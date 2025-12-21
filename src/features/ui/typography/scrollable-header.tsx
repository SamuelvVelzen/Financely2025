"use client";

import { useScrollToElement } from "@/features/users/hooks/useScrollToElement";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";

type IScrollableHeaderProps = {
  id: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
} & PropsWithChildren &
  IPropsWithClassName;

export function ScrollableHeader({
  id,
  children,
  className = "",
  as: Component = "h2",
}: IScrollableHeaderProps) {
  const scrollToElement = useScrollToElement(id);

  return (
    <Component
      id={id}
      className={cn(
        "text-lg font-semibold text-text scroll-mt-8 cursor-pointer group hover:text-primary transition-colors",
        className
      )}
      onClick={scrollToElement}>
      <span className="text-text-muted group-hover:text-primary"># </span>
      {children}
    </Component>
  );
}
