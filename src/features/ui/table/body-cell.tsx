"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IBodyCellProps = {
  autoFit?: boolean;
  wrap?: boolean;
  colSpan?: number;
} & IPropsWithClassName &
  PropsWithChildren;

export function BodyCell({
  className,
  children,
  autoFit = true,
  wrap = false,
  colSpan,
}: IBodyCellProps) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "p-3",
        autoFit ? "w-auto" : "w-full min-w-0",
        !wrap && "whitespace-nowrap",
        className
      )}
    >
      {children}
    </td>
  );
}
