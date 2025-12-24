"use client";

import { cn } from "@/features/util/cn";
import { Button, IButtonProps, IVariant } from "./button";

type ILinkButton = {
  clicked: NonNullable<IButtonProps["clicked"]>;
  disabled?: IButtonProps["disabled"];
} & Omit<IButtonProps, "clicked" | "type">;

export function LinkButton({
  children,
  className,
  clicked,
  disabled = false,
  variant = "default",
  ...props
}: ILinkButton) {
  const variantClasses: { [key in IVariant]: string } = {
    default: "hover:bg-transparent",
    primary: "hover:bg-transparent text-primary",
    danger: "hover:bg-transparent text-danger",
    info: "hover:bg-transparent text-info",
    warning: "hover:bg-transparent text-warning",
    success: "hover:bg-transparent text-success",
    secondary: "hover:bg-transparent text-secondary",
  };

  return (
    <Button
      className={cn(
        "hover:underline p-0 border-none hover:bg-transparent text-sm font-normal",
        variantClasses[variant],
        className
      )}
      clicked={clicked}
      disabled={disabled}
      {...props}>
      {children}
    </Button>
  );
}
