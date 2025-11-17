"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IButtonVariant =
  | "default"
  | "danger"
  | "info"
  | "warning"
  | "success";

export type IButtonProps = {
  clicked: () => void;
  buttonContent?: string | React.ReactNode;
  variant?: IButtonVariant;
} & PropsWithChildren &
  IPropsWithClassName;

export function Button({
  buttonContent,
  className,
  clicked,
  children,
  variant = "default",
}: IButtonProps) {
  const variantClasses = {
    default: "hover:bg-surface-hover border-border",
    danger: "bg-danger hover:bg-danger-hover text-white border-danger",
    info: "bg-info hover:bg-info-hover text-white border-info",
    warning: "bg-warning hover:bg-warning-hover text-white border-warning",
    success: "bg-success hover:bg-success-hover text-white border-success",
  };

  const baseClasses = "p-2 border rounded-full cursor-pointer";

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={() => clicked()}>
      {buttonContent ?? children}
    </button>
  );
}
