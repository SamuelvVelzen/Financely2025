import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";

type IDropdownItemEmptyProps = {} & IPropsWithClassName & PropsWithChildren;

export function DropdownItemEmpty({
  className = "",
  children,
}: IDropdownItemEmptyProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "hover:bg-surface-hover px-3 py-2 text-nowrap font-normal w-full rounded-none justify-start focus:ring-0",
        "border-x-0 border-b-0 border-t-0 not-first:border-t not-first:border-border",
        "text-text-muted cursor-default",
        className
      )}
      tabIndex={-1}>
      {children}
    </div>
  );
}
