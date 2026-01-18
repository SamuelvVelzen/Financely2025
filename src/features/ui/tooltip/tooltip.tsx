import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useDialogContext } from "../dialog/dialog/dialog-context";
import { type IPlacementOption } from "../dropdown/hooks/use-floating-placement";
import { useTooltipPlacement } from "./use-tooltip-placement";

export type ITooltipProps = {
  /** The trigger element that will show the tooltip on hover/focus */
  children: React.ReactElement;
  /** Tooltip content - supports rich content (React nodes) */
  content: React.ReactNode;
  /** Placement preference. Defaults to "auto" */
  placement?: IPlacementOption | IPlacementOption[];
  /** Delay in milliseconds before showing the tooltip. Defaults to 0 */
  delay?: number;
  /** Disable the tooltip */
  disabled?: boolean;
  /** Controlled mode: whether tooltip is open */
  open?: boolean;
  /** Controlled mode: callback when open state changes */
  onOpenChange?: (open: boolean) => void;
} & IPropsWithClassName;

export function Tooltip({
  children,
  content,
  placement = "auto",
  delay = 0,
  disabled = false,
  className = "",
  open: controlledOpen,
  onOpenChange,
}: ITooltipProps) {
  const dialogContext = useDialogContext();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  // Use controlled state if provided, otherwise use internal state
  const tooltipIsOpen =
    controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setTooltipState = (newState: boolean) => {
    if (disabled) return;

    // Clear any pending delay timeout
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    if (onOpenChange) {
      onOpenChange(newState);
    } else {
      setInternalOpen(newState);
    }
  };

  // Set mounted state for SSR safety (needed for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate tooltip position using the tooltip placement hook (centers tooltip)
  const tooltipPosition = useTooltipPlacement({
    isOpen: tooltipIsOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: contentRef as React.RefObject<HTMLElement>,
    placement,
  });

  // Handle hover events
  const handleMouseEnter = () => {
    if (disabled) return;

    // If already open, don't create a new timeout
    if (tooltipIsOpen) return;

    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        setTooltipState(true);
      }, delay);
    } else {
      setTooltipState(true);
    }
  };

  const handleMouseLeave = () => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    setTooltipState(false);
  };

  // Handle focus events (for keyboard accessibility)
  const handleFocus = () => {
    if (disabled) return;

    // If already open, don't create a new timeout
    if (tooltipIsOpen) return;

    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        setTooltipState(true);
      }, delay);
    } else {
      setTooltipState(true);
    }
  };

  const handleBlur = () => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    setTooltipState(false);
  };

  // Handle keyboard (ESC to close)
  useEffect(() => {
    if (!tooltipIsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTooltipState(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tooltipIsOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, []);

  // Clone the trigger element and add event handlers and ARIA attributes
  const triggerElement = isValidElement(children)
    ? cloneElement(children, {
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
          // Preserve existing ref if it exists
          const existingRef = (children as any).ref;
          if (typeof existingRef === "function") {
            existingRef(node);
          } else if (existingRef) {
            (
              existingRef as React.MutableRefObject<HTMLElement | null>
            ).current = node;
          }
        },
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        "aria-describedby": tooltipIsOpen ? tooltipId : undefined,
      } as any)
    : children;

  // Render tooltip content via portal
  const tooltipContent =
    tooltipIsOpen && isMounted ? (
      <div
        ref={contentRef}
        id={tooltipId}
        role="tooltip"
        className={cn(
          "bg-surface border border-border rounded-2xl shadow-lg",
          "text-sm text-text px-3 py-2",
          "max-w-xs wrap-break-word",
          className
        )}
        style={{
          position: "fixed",
          // If inside a dialog, use dialog's z-index + 5, otherwise use 50
          zIndex: dialogContext ? dialogContext.zIndex + 5 : 50,
          visibility: tooltipPosition ? "visible" : "hidden",
          top: tooltipPosition ? `${tooltipPosition.top}px` : "-9999px",
          left: tooltipPosition ? `${tooltipPosition.left}px` : "-9999px",
          maxWidth: tooltipPosition?.maxWidth
            ? `${tooltipPosition.maxWidth}px`
            : undefined,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        {content}
      </div>
    ) : null;

  return (
    <>
      {triggerElement}
      {isMounted && typeof window !== "undefined" && tooltipContent
        ? createPortal(tooltipContent, document.body)
        : tooltipContent}
    </>
  );
}
