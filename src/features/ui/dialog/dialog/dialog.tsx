"use client";

import { cn } from "@/util/cn";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { HiX } from "react-icons/hi";
import { Button } from "../../button/button";
import { IconButton } from "../../button/icon-button";
import { DialogContext } from "./dialog-context";
import { DialogOverlay } from "./dialog-overlay";
import type { IDialogProps, IDialogStatus } from "./types";
import { useDialogStack } from "./use-dialog-stack";

/**
 * Dialog component provides a fully accessible modal dialog system
 *
 * Features:
 * - Controlled and uncontrolled modes
 * - Multiple variants (modal, fullscreen)
 * - Full accessibility support (ARIA, focus trap, keyboard navigation)
 * - SSR safe portal rendering
 * - Configurable animations with motion preference support
 * - Always renders header and footer (header shows title, footer shows actions)
 *
 * @example
 * ```tsx
 * // Simple usage with title and content
 * <Dialog
 *   title="Dialog Title"
 *   content="Dialog content text"
 *   footer={<button onClick={() => setOpen(false)}>Close</button>}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom content as ReactNode
 * <Dialog
 *   title="Confirm Delete"
 *   content={<p>Are you sure?</p>}
 *   footer={
 *     <>
 *       <button>Cancel</button>
 *       <button>Confirm</button>
 *     </>
 *   }
 *   showCloseButton={true}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */
export function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
  dismissible = true,
  variant = "modal",
  size = "md",
  status,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className = "",
  style,
  onClose,
  title,
  content,
  footerButtons,
}: IDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const dialogIdRef = useRef<string>(
    `dialog-${Math.random().toString(36).substr(2, 9)}`
  );

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  // Get z-index for dialog stacking (must be after open is defined)
  const dialogZIndex = useDialogStack(open ? dialogIdRef.current : undefined);

  // Set mounted state for SSR safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle open state changes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  // Track active element before opening
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      previousActiveElement.current =
        (document.activeElement as HTMLElement) || null;

      // Store trigger element if available (for focus restoration)
      const storedTrigger = sessionStorage.getItem("dialog-trigger-id");
      if (storedTrigger) {
        const element = document.getElementById(storedTrigger);
        if (element) {
          triggerRef.current = element as HTMLElement;
        }
      }
    } else if (!open && previousActiveElement.current) {
      onClose?.();

      const timer = setTimeout(() => {
        // Restore focus
        if (triggerRef.current) {
          triggerRef.current.focus();
          triggerRef.current = null;
        } else if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
        previousActiveElement.current = null;
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  // Get all focusable elements within dialog
  const getFocusableElements = useCallback(() => {
    if (!dialogRef.current || typeof window === "undefined") return [];

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }, []);

  // Focus trap: handle Tab and Shift+Tab
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && dismissible) {
        handleOpenChange(false);
        return;
      }

      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        // No focusable elements, prevent tabbing out
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Check if focus is within dialog
      const isFocusInDialog =
        dialogRef.current?.contains(activeElement) ||
        activeElement === dialogRef.current;

      if (!isFocusInDialog) {
        // Focus escaped, bring it back
        e.preventDefault();
        firstElement.focus();
        return;
      }

      if (e.shiftKey) {
        // Shift+Tab
        if (
          activeElement === firstElement ||
          activeElement === dialogRef.current
        ) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (
          activeElement === lastElement ||
          activeElement === dialogRef.current
        ) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [dismissible, handleOpenChange, getFocusableElements]
  );

  // Focus first element when dialog opens
  useEffect(() => {
    if (!open || !dialogRef.current || typeof window === "undefined") return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure dialog is visible
      setTimeout(() => {
        focusableElements[0].focus();
      }, 100);
    } else {
      // Focus dialog container if no focusable elements
      dialogRef.current.focus();
    }
  }, [open, getFocusableElements]);

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  // Generate title ID for aria-labelledby if title is provided
  // Regenerates only when title changes to maintain stable ID across re-renders
  // Must be called before any early returns to follow Rules of Hooks
  const titleId = useMemo(
    () =>
      title
        ? `dialog-title-${Math.random().toString(36).substr(2, 9)}`
        : undefined,
    [title]
  );
  const finalAriaLabelledBy = ariaLabelledBy || titleId;

  // Don't render on server when closed
  if (!isMounted && !open) return null;

  // If closed don't render
  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "1/2": "max-w-1/2",
    "3/4": "max-w-3/4",
    full: "max-w-full",
  };

  const variantClasses = {
    modal: cn(
      "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
      sizeClasses[size],
      "w-[calc(100%-2rem)] max-h-[90vh]",
      "motion-safe:transition-all motion-safe:duration-300",
      "data-[state=open]:motion-safe:opacity-100 data-[state=open]:motion-safe:scale-100",
      "data-[state=closed]:motion-safe:opacity-0 data-[state=closed]:motion-safe:scale-95"
    ),
    fullscreen: cn(
      "fixed inset-0 w-full h-full",
      "motion-safe:transition-opacity motion-safe:duration-300",
      "data-[state=open]:motion-safe:opacity-100",
      "data-[state=closed]:motion-safe:opacity-0"
    ),
  };

  const baseClasses = cn(
    "bg-surface border border-border rounded-2xl",
    "shadow-lg outline-none",
    "flex flex-col overflow-hidden",
    variantClasses[variant],
    className
  );

  // Determine content to display (content prop takes precedence over children)
  const bodyContent = content !== undefined ? content : children;

  const statusClasses: Record<IDialogStatus | "none", string> = {
    none: "",
    danger: "text-danger",
    info: "text-info",
    warning: "text-warning",
    success: "text-success",
  };

  const dialogContent = (
    <DialogContext.Provider value={{ zIndex: dialogZIndex }}>
      <DialogOverlay
        open={open}
        dismissible={dismissible}
        onClick={handleClose}
        dialogId={dialogIdRef.current}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={finalAriaLabelledBy}
        data-state={open ? "open" : "closed"}
        data-variant={variant}
        data-size={size}
        data-status={status}
        className={baseClasses}
        style={{ ...style, zIndex: dialogZIndex }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header - Always rendered */}
        <header
          className={cn(
            "flex items-center justify-between gap-4 px-6 py-4 border-b border-border"
          )}
          id={titleId}
        >
          <div className="flex-1">
            <h2
              className={cn(
                "text-xl font-semibold",
                statusClasses[status ?? "none"]
              )}
            >
              {title}
            </h2>
          </div>

          <IconButton clicked={handleClose}>
            <HiX className="w-5 h-5" />
          </IconButton>
        </header>

        <div className={"px-6 py-4 overflow-y-auto max-h-[60vh]"}>
          {bodyContent}
        </div>

        {footerButtons && footerButtons.length > 0 && (
          <footer
            className={
              "flex items-center gap-3 px-6 py-4 border-t border-border justify-end "
            }
          >
            {footerButtons?.map((buttonProps, index) => (
              <Button key={index} {...buttonProps} />
            ))}
          </footer>
        )}
      </div>
    </DialogContext.Provider>
  );

  // Portal rendering with SSR safety
  if (isMounted && typeof window !== "undefined") {
    const container = document.body;
    return createPortal(dialogContent, container);
  }

  // Fallback for SSR or non-portal mode
  if (!isMounted) return null;
  return dialogContent;
}
