import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type ITableHeaderProps = IPropsWithClassName & PropsWithChildren;

export function TableHeader({ className, children }: ITableHeaderProps) {
  return (
    <thead className={cn("bg-surface-hover", className)}>{children}</thead>
  );
}

TableHeader.displayName = "TableHeader";
