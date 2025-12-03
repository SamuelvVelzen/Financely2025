"use client";

import { cn } from "@/util/cn";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type IButtonVariant =
  | "default"
  | "danger"
  | "info"
  | "warning"
  | "success"
  | "primary";

export type IButtonProps = {
  buttonContent?: string | ReactNode;
  variant?: IButtonVariant;
  disabled?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> &
  (
    | {
        type?: "button";
        clicked: () => void;
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
  ...rest
}: IButtonProps) {
  const variantClasses: { [key in IButtonVariant]: string } = {
    default: "hover:bg-surface-hover border-current",
    danger: "bg-danger hover:bg-danger-hover text-white border-danger",
    info: "bg-info hover:bg-info-hover text-white border-info",
    warning: "bg-warning hover:bg-warning-hover text-white border-warning",
    success: "bg-success hover:bg-success-hover text-white border-success",
    primary: "bg-primary hover:bg-primary-hover text-white border-primary",
  };

  const baseClasses =
    "px-4 py-2 border rounded-2xl cursor-pointer flex items-center text-base font-medium gap-2 bg-surface";
  const disabledClasses =
    disabled && "opacity-50 cursor-not-allowed pointer-events-none";

  return (
    <button
      type={type}
      className={cn(
        baseClasses,
        variantClasses[variant],
        className,
        disabledClasses
      )}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        clicked?.();
      }}
      {...rest}
    >
      {buttonContent ?? children}
    </button>
  );
}
