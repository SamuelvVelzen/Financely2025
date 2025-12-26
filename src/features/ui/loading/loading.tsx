"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type ILoadingProps = {
  text?: string;
} & IPropsWithClassName &
  PropsWithChildren;

export function Loading({
  text = "Loading",
  className = "",
  children,
}: ILoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
      role="status"
      aria-label={text}>
      <div
        className="size-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
        aria-hidden="true"
      />
      {text && !children && (
        <p
          className="text-sm text-text-muted"
          aria-live="polite">
          {text}...
        </p>
      )}
      {!text && children}
    </div>
  );
}
