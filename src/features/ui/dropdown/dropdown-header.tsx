import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { type PropsWithChildren } from "react";
import { dropdownHeaderBorderClasses } from "./dropdown-item-classes";

type IDropdownHeaderProps = {} & IPropsWithClassName & PropsWithChildren;

export function DropdownHeader({
  className = "",
  children,
}: IDropdownHeaderProps) {
  return (
    <div
      role="presentation"
      data-dropdown-header
      className={cn(
        "border px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted select-none bg-surface",
        dropdownHeaderBorderClasses,
        className
      )}>
      {children}
    </div>
  );
}
