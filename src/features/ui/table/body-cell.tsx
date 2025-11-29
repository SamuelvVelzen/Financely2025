"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IBodyCellProps = {
  autoFit?: boolean;
} & IPropsWithClassName &
  PropsWithChildren;

export function BodyCell({
  className,
  children,
  autoFit = true,
}: IBodyCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-2",
        autoFit ? "w-auto" : "w-full min-w-0",
        className
      )}
    >
      {children}
    </td>
  );
}
