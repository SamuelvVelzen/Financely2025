"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, ReactNode } from "react";
import { Button, IButtonProps } from "./button";

type IIconButton = {
  icon?: ReactNode;
  clicked: IButtonProps["clicked"];
  disabled?: IButtonProps["disabled"];
} & PropsWithChildren &
  IPropsWithClassName;

export function IconButton({
  children,
  className,
  icon,
  clicked,
  disabled = false,
}: IIconButton) {
  const iconButtonContent = children ? children : icon;

  return (
    <Button
      className={cn("rounded-full p-2", className)}
      clicked={clicked}
      disabled={disabled}
      buttonContent={iconButtonContent}
    />
  );
}
