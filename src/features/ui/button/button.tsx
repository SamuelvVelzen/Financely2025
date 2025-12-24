"use client";

import { cn } from "@/features/util/cn";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type IButtonSize = "xs" | "sm" | "md" | "lg";

export type IVariant =
  | "default"
  | "danger"
  | "info"
  | "warning"
  | "success"
  | "primary"
  | "secondary";

export type IButtonProps = {
  buttonContent?: string | ReactNode;
  variant?: IVariant;
  disabled?: boolean;
  size?: IButtonSize;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> &
  (
    | {
        type?: "button";
        clicked: (event: React.MouseEvent<HTMLButtonElement>) => void;
      }
    | {
        type: "submit" | "reset";
        clicked?: never;
      }
  );

export function Button({
  buttonContent,
  className,
  clicked,
  children,
  disabled = false,
  onClick,
  type = "button",
  variant = "default",
  size = "md",
  ...rest
}: IButtonProps) {
  const variantClasses: { [key in IVariant]: string } = {
    default: "hover:bg-surface-hover border-border",
    danger: "bg-danger hover:bg-danger-hover text-white border-danger",
    info: "bg-info hover:bg-info-hover text-white border-info",
    warning: "bg-warning hover:bg-warning-hover text-white border-warning",
    success: "bg-success hover:bg-success-hover text-white border-success",
    primary: "bg-primary hover:bg-primary-hover text-white border-primary",
    secondary:
      "bg-secondary hover:bg-secondary-hover text-white border-secondary",
  };

  const baseClasses =
    "border rounded-2xl cursor-pointer flex items-center justify-center text-base font-medium gap-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary";
  const disabledClasses = disabled && "pointer-events-none";
  const sizeClasses: { [key in IButtonSize]: string } = {
    xs: "px-0.5 py-0.5 text-xs",
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  return (
    <div className={disabled ? "opacity-50 cursor-not-allowed" : ""}>
      <button
        type={type}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
          disabledClasses
        )}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);
          clicked?.(event);
        }}
        {...rest}>
        {buttonContent ?? children}
      </button>
    </div>
  );
}
