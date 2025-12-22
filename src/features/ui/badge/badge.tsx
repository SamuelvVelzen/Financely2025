"use client";

import { cn } from "@/features/util/cn";
import { type ReactNode } from "react";

export type IBadgeProps = {
  backgroundColor?: string;
  children: ReactNode;
  className?: string;
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

export function Badge({ backgroundColor, children, className }: IBadgeProps) {
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: backgroundColor || "var(--surface-hover)",
        color: backgroundColor
          ? getContrastingTextColor(backgroundColor)
          : "var(--text)",
      }}
    >
      {children}
    </span>
  );
}

