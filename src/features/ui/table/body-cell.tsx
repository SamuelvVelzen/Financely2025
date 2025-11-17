"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type BodyCellProps = PropsWithClassName & PropsWithChildren;

export function BodyCell({ className, children }: BodyCellProps) {
  return <td className={cn("px-4 py-2", className)}>{children}</td>;
}
