import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { PropsWithChildren, ReactNode } from "react";
import { IVariant } from "../button/button";
import { Tooltip } from "../tooltip/tooltip";

type IBadgeColorProps =
  | {
    backgroundColor?: string;
    variant?: never;
  }
  | { variant: IVariant; backgroundColor?: never };

export type IBadgeProps = IBadgeColorProps &
  IPropsWithClassName &
  PropsWithChildren &
  Omit<React.HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
    /** Optional tooltip text. If provided, wraps the badge with a tooltip */
    tooltip?: ReactNode;
    /** Tooltip placement. Defaults to "auto" */
    tooltipPlacement?: "top" | "bottom" | "left" | "right" | "auto";
  };

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
  tooltip,
  tooltipPlacement = "auto",
  ...rest
}: IBadgeProps) {
  const backgroundColorClass = backgroundColor
    ? `bg-[${backgroundColor}]`
    : variant
      ? variantClasses[variant].backgroundColor
      : "bg-surface-hover";
  const textColorClass = backgroundColor
    ? `text-[${getContrastingTextColor(backgroundColor)}]`
    : variant
      ? variantClasses[variant].textColor
      : "text-text";

  const badge = (
    <span
      {...rest}
      className={cn(
        "px-2.5 py-0.5 rounded-full flex items-center gap-1 text-xs font-medium max-w-full truncate",
        backgroundColorClass,
        textColorClass,
        className
      )}
      style={{ ...rest.style, backgroundColor, color: textColorClass }}>
      {children}
    </span>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} placement={tooltipPlacement}>
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
