"use client";

import { cn } from "@/features/util/cn";
import { ReactNode } from "react";
import { Button, IButtonProps, IButtonSize } from "./button";

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
  size = "md",
  ...props
}: IIconButton) {
  const iconButtonContent = children ? children : icon;

  const sizeClasses: { [key in IButtonSize]: string } = {
    xs: "p-0.5 -my-0.5",
    sm: "p-2 -my-2.",
    md: "p-4 -my-4",
    lg: "p-6 -my-6",
  };

  return (
    <Button
      className={cn("rounded-full", sizeClasses[size], className)}
      clicked={clicked}
      disabled={disabled}
      buttonContent={iconButtonContent}
      size={size}
      {...props}
    />
  );
}
