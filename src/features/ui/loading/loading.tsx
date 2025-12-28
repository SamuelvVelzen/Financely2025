"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";
import { Spinner, type ISpinnerSize } from "./spinner";

export type ILoadingSize = ISpinnerSize;

export type ILoadingProps = {
  text?: string;
  size?: ILoadingSize;
} & IPropsWithClassName &
  PropsWithChildren;

export function Loading({
  text = "Loading",
  size = "md",
  className = "",
  children,
}: ILoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
      role="status"
      aria-label={text}>
      <Spinner size={size} />
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
