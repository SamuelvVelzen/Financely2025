"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IButtonVariant =
  | "default"
  | "danger"
  | "info"
  | "warning"
  | "success"
  | "primary";

export type IButtonProps = {
  clicked: () => void;
  buttonContent?: string | React.ReactNode;
  variant?: IButtonVariant;
  disabled?: boolean;
} & PropsWithChildren &
  IPropsWithClassName;

export function Button({
  buttonContent,
  className,
  clicked,
  children,
  disabled = false,
  variant = "default",
}: IButtonProps) {
  const variantClasses: { [key in IButtonVariant]: string } = {
    default: "hover:bg-surface-hover border-border",
    danger: "bg-danger hover:bg-danger-hover text-white border-danger",
    info: "bg-info hover:bg-info-hover text-white border-info",
    warning: "bg-warning hover:bg-warning-hover text-white border-warning",
    success: "bg-success hover:bg-success-hover text-white border-success",
    primary: "bg-primary hover:bg-primary-hover text-white border-primary",
  };

  const baseClasses = "p-2 border rounded-2xl cursor-pointer flex items-center";
  const disabledClasses =
    disabled && "opacity-50 cursor-not-allowed pointer-events-none";

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        className,
        disabledClasses
      )}
      onClick={() => clicked()}
      disabled={disabled}
    >
      {buttonContent ?? children}
    </button>
  );
}
