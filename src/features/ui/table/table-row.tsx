import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { MouseEvent, PropsWithChildren } from "react";

export type ITableRowProps = {
  rowIndex?: number;
  onClick?: (e: MouseEvent<HTMLTableRowElement>) => void;
} & IPropsWithClassName &
  PropsWithChildren;

export function TableRow({
  rowIndex,
  className,
  children,
  onClick,
}: ITableRowProps) {
  return (
    <tr
      className={cn(
        "group motion-safe:transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}>
      {children}
    </tr>
  );
}
