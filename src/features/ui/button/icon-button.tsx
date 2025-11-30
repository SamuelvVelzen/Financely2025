"use client";

import { cn } from "@/util/cn";
import { ReactNode } from "react";
import { Button, IButtonProps } from "./button";

type IIconButton = {
  icon?: ReactNode;
  clicked: NonNullable<IButtonProps["clicked"]>;
  disabled?: IButtonProps["disabled"];
} & Omit<IButtonProps, "clicked" | "type">;

export function IconButton({
  children,
  className,
  icon,
  clicked,
  disabled = false,
  ...props
}: IIconButton) {
  const iconButtonContent = children ? children : icon;

  return (
    <Button
      className={cn("rounded-full p-2", className)}
      clicked={clicked}
      disabled={disabled}
      buttonContent={iconButtonContent}
      {...props}
    />
  );
}
