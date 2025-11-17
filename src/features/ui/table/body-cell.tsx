"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IBodyCellProps = IPropsWithClassName & PropsWithChildren;

export function BodyCell({ className, children }: IBodyCellProps) {
  return <td className={cn("px-4 py-2", className)}>{children}</td>;
}
