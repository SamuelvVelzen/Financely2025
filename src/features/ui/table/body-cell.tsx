import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";
import { IBaseCellProps } from "./table";

export type IBodyCellProps = {
  autoFit?: boolean;
  wrap?: boolean;
  colSpan?: number;
  stopPropagation?: boolean;
} & IPropsWithClassName &
  PropsWithChildren &
  IBaseCellProps;

export function BodyCell({
  className,
  children,
  autoFit = true,
  wrap = false,
  colSpan,
  size = "md",
  sticky = false,
  hidden = false,
  stopPropagation = true,
}: IBodyCellProps) {
  const sizeClasses = {
    sm: "px-3 py-1",
    md: "px-3 py-1.5",
    lg: "px-3 py-2",
  };

  if (hidden) {
    return null;
  }

  return (
    <td
      colSpan={colSpan}
      className={cn(
        "group-hover:bg-surface-hover border-b border-border",
        sizeClasses[size],
        autoFit ? "w-auto" : "w-full min-w-0",
        !wrap && "whitespace-nowrap",
        sticky && "sticky left-0 z-10 bg-surface border-r border-border",
        className
      )}>
      <span
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
        }}>
        {children}
      </span>
    </td>
  );
}
