"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";
import { IVariant } from "../button/button";

type IBadgeColorProps =
  | {
      backgroundColor?: string;
      variant?: never;
    }
  | { variant: IVariant; backgroundColor?: never };

export type IBadgeProps = IBadgeColorProps &
  IPropsWithClassName &
  PropsWithChildren;

/**
 * Calculate whether text should be light or dark based on background color
 * Uses relative luminance formula
 */
function getContrastingTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark for light backgrounds
  return luminance > 0.5 ? "#171717" : "#ffffff";
}

const variantClasses: {
  [key in IVariant]: { backgroundColor: string; textColor: string };
} = {
  default: { backgroundColor: "bg-surface-hover", textColor: "text-text" },
  danger: { backgroundColor: "bg-danger", textColor: "text-white" },
  info: { backgroundColor: "bg-info", textColor: "text-white" },
  warning: { backgroundColor: "bg-warning", textColor: "text-white" },
  success: { backgroundColor: "bg-success", textColor: "text-white" },
  primary: { backgroundColor: "bg-primary", textColor: "text-white" },
  secondary: { backgroundColor: "bg-secondary", textColor: "text-white" },
};

export function Badge({
  backgroundColor,
  variant,
  children,
  className,
}: IBadgeProps) {
  const backgroundColorClass = backgroundColor
    ? backgroundColor
    : variant
      ? variantClasses[variant].backgroundColor
      : "bg-surface-hover";
  const textColorClass = backgroundColor
    ? getContrastingTextColor(backgroundColor)
    : variant
      ? variantClasses[variant].textColor
      : "text-text";

  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        backgroundColorClass,
        textColorClass,
        className
      )}>
      {children}
    </span>
  );
}
