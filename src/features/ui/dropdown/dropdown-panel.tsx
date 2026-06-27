import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { type PropsWithChildren } from "react";
import { dropdownPanelContentClasses } from "./dropdown-item-classes";

type IDropdownPanelProps = {} & PropsWithChildren & IPropsWithClassName;

export function DropdownPanel({ children, className = "" }: IDropdownPanelProps) {
  return (
    <div className={cn(dropdownPanelContentClasses, className)}>{children}</div>
  );
}

DropdownPanel.displayName = "DropdownPanel";
