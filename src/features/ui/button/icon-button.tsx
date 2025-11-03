"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, ReactNode } from "react";
import { Button, IButtonProps } from "./button";

type IIconButton = {
  icon?: ReactNode;
  clicked: IButtonProps["clicked"];
} & PropsWithChildren &
  PropsWithClassName;

export function IconButton({
  children,
  className,
  icon,
  clicked,
}: IIconButton) {
  const iconButtonContent = children ? children : icon;

  return (
    <Button
      className={cn(className)}
      clicked={clicked}
      buttonContent={iconButtonContent}
    />
  );
}
