import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { type PropsWithChildren } from "react";
import {
  dropdownFooterBorderClasses,
  dropdownPanelFooterBorderClasses,
} from "./dropdown-item-classes";

type IDropdownFooterProps = {} & PropsWithChildren & IPropsWithClassName;

export function DropdownFooter({ children, className = "" }: IDropdownFooterProps) {
  return (
    <div
      className={cn(
        "flex gap-2",
        dropdownPanelFooterBorderClasses,
        dropdownFooterBorderClasses,
        className
      )}>
      {children}
    </div>
  );
}

DropdownFooter.displayName = "DropdownFooter";
