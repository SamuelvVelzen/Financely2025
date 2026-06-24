import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { type PropsWithChildren } from "react";
import { dropdownItemBorderClasses } from "./dropdown-item-classes";

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
        "border px-3 py-2 text-nowrap font-normal w-full",
        dropdownItemBorderClasses,
        "text-text-muted cursor-default",
        className
      )}
      tabIndex={-1}>
      {children}
    </div>
  );
}
