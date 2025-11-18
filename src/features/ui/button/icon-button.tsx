"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, ReactNode } from "react";
import { Button, IButtonProps } from "./button";

type IIconButton = {
  icon?: ReactNode;
  clicked: IButtonProps["clicked"];
} & PropsWithChildren &
  IPropsWithClassName;

export function IconButton({
  children,
  className,
  icon,
  clicked,
}: IIconButton) {
  const iconButtonContent = children ? children : icon;

  return (
    <Button
      className={cn("rounded-full", className)}
      clicked={clicked}
      buttonContent={iconButtonContent}
    />
  );
}
