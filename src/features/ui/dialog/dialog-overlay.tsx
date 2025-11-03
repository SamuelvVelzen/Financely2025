"use client";

import { useEffect } from "react";
import type { DialogOverlayProps } from "./types";

/**
 * DialogOverlay component renders the backdrop behind dialog content
 *
 * Features:
 * - Prevents background scrolling when open
 * - Supports click-to-dismiss when dismissible
 * - Provides data attributes for styling
 */
export function DialogOverlay({
  dismissible = true,
  onClick,
  open = false,
  className = "",
}: DialogOverlayProps) {
  // Lock body scroll when overlay is open
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = "";
    };
  }, [open]);

  if (!open) return null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only dismiss if clicking directly on overlay, not children
    if (e.target === e.currentTarget && dismissible && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={
        "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm " +
        "motion-safe:transition-opacity motion-safe:duration-200 " +
        "data-[state=open]:motion-safe:opacity-100 data-[state=closed]:motion-safe:opacity-0 " +
        className
      }
      data-state={open ? "open" : "closed"}
      data-dismissible={dismissible ? "true" : "false"}
      onClick={handleClick}
      aria-hidden="true"
    />
  );
}
