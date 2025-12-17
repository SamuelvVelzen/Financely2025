"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, ReactNode } from "react";
import { Button, IButtonProps } from "../button/button";

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
      className={cn(
        "gap-2 hover:bg-surface-hover px-3 py-2 text-nowrap font-normal w-full border-0 rounded-none justify-start",
        selected && "bg-primary/10 text-primary font-medium",
        className
      )}
      clicked={clicked}
    >
      {icon && <span>{icon}</span>} {content}
    </Button>
  );
}
