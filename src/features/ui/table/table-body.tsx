import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { type PropsWithChildren } from "react";

export type ITableBodyProps = IPropsWithClassName & PropsWithChildren;

export function TableBody({ className, children }: ITableBodyProps) {
  return (
    <tbody className={cn("[&>tr:last-child>td]:border-b-0", className)}>
      {children}
    </tbody>
  );
}

TableBody.displayName = "TableBody";
