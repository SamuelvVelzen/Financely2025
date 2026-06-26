import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { type PropsWithChildren, type ReactNode } from "react";
import { Button, type IButtonProps } from "../button/button";
import { dropdownItemBorderClasses } from "./dropdown-item-classes";

type IDropdownItemProps = {
  text?: string;
  icon?: ReactNode;
  clicked: NonNullable<IButtonProps["clicked"]>;
  selected?: boolean;
} & PropsWithChildren &
  IPropsWithClassName;

export function DropdownItem({
  className = "",
  children,
  text,
  icon,
  clicked,
  selected = false,
}: IDropdownItemProps) {
  const content = children ? children : text;

  return (
    <Button
      data-dropdown-item
      className={cn(
        "gap-2 hover:bg-surface-hover px-3 py-2 text-nowrap font-normal w-full justify-start! text-left",
        dropdownItemBorderClasses,
        selected &&
          "bg-primary/10 hover:bg-primary/20 text-primary font-medium",
        className
      )}
      clicked={clicked}>
      {icon && <span>{icon}</span>} {content}
    </Button>
  );
}
