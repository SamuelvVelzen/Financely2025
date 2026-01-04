import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IBodyCellProps = {
  autoFit?: boolean;
  wrap?: boolean;
  colSpan?: number;
  size?: "sm" | "md" | "lg";
} & IPropsWithClassName &
  PropsWithChildren;

export function BodyCell({
  className,
  children,
  autoFit = true,
  wrap = false,
  colSpan,
  size = "md",
}: IBodyCellProps) {
  const sizeClasses = {
    sm: "px-3 py-1",
    md: "px-3 py-1.5",
    lg: "px-3 py-2",
  };

  return (
    <td
      colSpan={colSpan}
      className={cn(
        sizeClasses[size],
        autoFit ? "w-auto" : "w-full min-w-0",
        !wrap && "whitespace-nowrap",
        className
      )}>
      {children}
    </td>
  );
}
