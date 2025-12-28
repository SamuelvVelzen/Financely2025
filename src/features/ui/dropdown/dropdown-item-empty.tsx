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
        "hover:bg-surface-hover px-3 py-2 text-nowrap font-normal w-full border-0 rounded-none justify-start focus:ring-0",
        "text-text-muted cursor-default",
        className
      )}
      tabIndex={-1}>
      {children}
    </div>
  );
}
