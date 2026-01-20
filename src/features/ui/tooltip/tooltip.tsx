import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export type IPlacementOption = "top" | "bottom" | "left" | "right" | "auto";

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

/**
 * Tooltip component using native Popover API and CSS Anchor Positioning
 *
 * Features:
 * - Native popover="hint" for tooltip behavior
 * - CSS anchor positioning for smart placement
 * - Automatic top-layer rendering
 * - Hover and focus triggers
 * - Automatic flip fallbacks when near viewport edges
 */
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
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate unique IDs for anchor positioning
  const uniqueId = useId();
  const anchorName = `--tooltip-anchor-${uniqueId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const tooltipId = `tooltip-${uniqueId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Use controlled state if provided, otherwise use internal state
  const tooltipIsOpen =
    controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setTooltipState = useCallback(
    (newState: boolean) => {
      if (disabled && newState) return;

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
    },
    [disabled, onOpenChange]
  );

  // Sync popover state with controlled open state
  useEffect(() => {
    const popover = contentRef.current;
    if (!popover) return;

    try {
      if (tooltipIsOpen && !popover.matches(":popover-open")) {
        popover.showPopover();
      } else if (!tooltipIsOpen && popover.matches(":popover-open")) {
        popover.hidePopover();
      }
    } catch {
      // Ignore errors if popover API not fully supported
    }
  }, [tooltipIsOpen]);

  // Determine CSS position classes based on placement prop
  const getPositionClasses = () => {
    const placementValue = Array.isArray(placement) ? placement[0] : placement;

    switch (placementValue) {
      case "top":
        return "tooltip-position-top";
      case "left":
        return "tooltip-position-left";
      case "right":
        return "tooltip-position-right";
      case "bottom":
        return "tooltip-position-bottom";
      case "auto":
      default:
        // Default to bottom for auto
        return "tooltip-position-bottom";
    }
  };

  // Handle hover events
  const handleMouseEnter = useCallback(() => {
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
  }, [disabled, tooltipIsOpen, delay, setTooltipState]);

  const handleMouseLeave = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    setTooltipState(false);
  }, [setTooltipState]);

  // Handle focus events (for keyboard accessibility)
  const handleFocus = useCallback(() => {
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
  }, [disabled, tooltipIsOpen, delay, setTooltipState]);

  const handleBlur = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    setTooltipState(false);
  }, [setTooltipState]);

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
      style: {
        ...((children.props as any)?.style || {}),
        anchorName,
      },
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      "aria-describedby": tooltipIsOpen ? tooltipId : undefined,
    } as any)
    : children;

  return (
    <>
      {triggerElement}
      <div
        ref={contentRef}
        id={tooltipId}
        popover="hint"
        role="tooltip"
        className={cn(
          "tooltip-popover",
          getPositionClasses(),
          "bg-surface border border-border rounded-2xl shadow-lg",
          "text-sm text-text px-3 py-2",
          "max-w-xs wrap-break-word",
          // Reset default popover styles
          "m-0 p-0 border-0 bg-transparent",
          // Ensure closed popovers stay hidden (styles override browser default)
          "not-[:popover-open]:hidden",
          className
        )}
        style={
          {
            positionAnchor: anchorName,
          } as React.CSSProperties
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        <div className="bg-surface border border-border rounded-2xl shadow-lg text-sm text-text px-3 py-2 max-w-xs w-max wrap-break-word">
          {content}
        </div>
      </div>
    </>
  );
}
