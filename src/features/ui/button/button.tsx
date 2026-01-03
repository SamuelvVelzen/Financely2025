"use client";

import { Spinner } from "@/features/ui/loading/spinner";
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
  loading?:
    | boolean
    | {
        isLoading?: boolean;
        text?: string;
      };
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> &
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
  loading = false,
  type = "button",
  variant = "default",
  size = "md",
  ...rest
}: IButtonProps) {
  const isLoading = typeof loading === "boolean" ? loading : loading.isLoading;

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
    "border rounded-2xl cursor-pointer flex items-center justify-center text-base font-medium gap-2 bg-surface focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const disabledClasses = (disabled || isLoading) && "pointer-events-none";
  const sizeClasses: { [key in IButtonSize]: string } = {
    xs: "px-0.5 py-0.25 text-xs",
    sm: "px-2 py-0.75 text-sm",
    md: "px-4 py-1.25 text-base",
    lg: "px-6 py-1.75 text-lg",
  };

  const button = (
    <button
      type={type}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
        disabledClasses
      )}
      disabled={disabled || isLoading}
      onClick={(event) => {
        // Prevent default form submission for button-type buttons
        if (type === "button") {
          event.preventDefault();
        }
        clicked?.(event);
      }}
      {...rest}>
      {isLoading && (
        <Spinner
          size={"sm"}
          variant={variant}
        />
      )}
      {buttonContent ?? children}
    </button>
  );

  if (disabled || isLoading) {
    return <span className="opacity-50 cursor-not-allowed">{button}</span>;
  }

  return button;
}
