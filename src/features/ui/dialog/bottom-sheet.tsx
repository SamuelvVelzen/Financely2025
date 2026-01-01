"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";
import { HiX } from "react-icons/hi";
import type { IButtonProps } from "../button/button";
import { Button } from "../button/button";
import { IconButton } from "../button/icon-button";
import { useDialogStack } from "./dialog/use-dialog-stack";
import { useFocusTrap } from "./dialog/use-focus-trap";

export type ISnapPoint = "dismiss" | "partial" | "full";

export interface IBottomSheetProps
  extends PropsWithChildren, IPropsWithClassName {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether sheet can be dismissed (by clicking overlay or pressing Esc) */
  dismissible?: boolean;
  /** Title for header */
  title: string;
  /** Footer buttons (array of button props) */
  footerButtons?: IButtonProps[];
  /** Custom style */
  style?: React.CSSProperties;
  /** ARIA label */
  "aria-label"?: string;
  /** ARIA labelled by element id */
  "aria-labelledby"?: string;
  /** Called when sheet closes */
  onClose?: () => void;
  /** Show drag handle */
  showDragHandle?: boolean;
  /** Partial height percentage (0-100), default 50 */
  partialHeight?: number;
  /** Initial snap point */
  initialSnapPoint?: ISnapPoint;
}

/**
 * BottomSheet component provides a mobile-friendly bottom sheet dialog
 *
 * Features:
 * - Slide-up animation from bottom
 * - Drag handle for visual feedback
 * - Snap points (dismiss, partial, full)
 * - Swipe gestures (swipe down to dismiss, drag to snap points)
 * - Full accessibility support (ARIA, focus trap, keyboard navigation)
 * - SSR safe portal rendering
 * - Configurable animations with motion preference support
 * - Always renders header and footer
 *
 * @example
 * ```tsx
 * <BottomSheet
 *   title="Filters"
 *   open={open}
 *   onOpenChange={setOpen}
 *   footerButtons={[
 *     {
 *       clicked: () => setOpen(false),
 *       buttonContent: "Close",
 *     },
 *   ]}>
 *   <div>Content here</div>
 * </BottomSheet>
 * ```
 */
export function BottomSheet({
  children,
  open: controlledOpen,
  onOpenChange,
  dismissible = true,
  title,
  footerButtons,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className = "",
  style,
  onClose,
  showDragHandle = true,
  partialHeight = 50,
  initialSnapPoint = "full",
}: IBottomSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const sheetIdRef = useRef<string>(
    `bottom-sheet-${Math.random().toString(36).substr(2, 9)}`
  );

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [snapPoint, setSnapPoint] = useState<ISnapPoint>(initialSnapPoint);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  // Get z-index for sheet stacking
  const sheetZIndex = useDialogStack(open ? sheetIdRef.current : undefined);

  // Set mounted state for SSR safety
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setWindowHeight(window.innerHeight);
      const handleResize = () => setWindowHeight(window.innerHeight);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Measure sheet height when opened and set initial position
  useEffect(() => {
    if (open && sheetRef.current) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (sheetRef.current) {
          const height = sheetRef.current.offsetHeight;
          setSheetHeight(height);
          setSnapPoint(initialSnapPoint);

          // Calculate initial position based on snap point
          const initialPositions = {
            dismiss: windowHeight,
            partial: windowHeight * (1 - partialHeight / 100),
            full: 0,
          };
          const initialPosition = initialPositions[initialSnapPoint] || 0;
          setCurrentTranslateY(initialPosition);

          // Set initial transform
          sheetRef.current.style.transform = `translateY(${initialPosition}px)`;
        }
      }, 50);
    } else if (!open) {
      // Reset on close
      setCurrentTranslateY(0);
      setIsDragging(false);
    }
  }, [open, initialSnapPoint, windowHeight, partialHeight]);

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
      const storedTrigger = sessionStorage.getItem("bottom-sheet-trigger-id");
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

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  // Calculate snap point positions
  const snapPositions = useMemo(() => {
    if (!sheetHeight || !windowHeight)
      return { dismiss: 0, partial: 0, full: 0 };

    const fullPosition = 0;
    const partialPosition = windowHeight * (1 - partialHeight / 100);
    const dismissPosition = windowHeight;

    return {
      dismiss: dismissPosition,
      partial: partialPosition,
      full: fullPosition,
    };
  }, [sheetHeight, windowHeight, partialHeight]);

  // Get current position based on snap point
  const getCurrentPosition = useCallback(() => {
    return snapPositions[snapPoint] || 0;
  }, [snapPoint, snapPositions]);

  // Handle drag start
  const handleDragStart = useCallback(
    (clientY: number) => {
      if (!dismissible && snapPoint === "full") return;
      setIsDragging(true);
      setDragStartY(clientY);
      // Prevent body scroll while dragging
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
      }
    },
    [dismissible, snapPoint]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging || !sheetRef.current) return;

      const deltaY = clientY - dragStartY;
      const newTranslateY = Math.max(0, currentTranslateY + deltaY);

      // Prevent dragging above full position
      if (newTranslateY < 0) return;

      setCurrentTranslateY(newTranslateY);
      setDragStartY(clientY);

      // Update sheet position
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${newTranslateY}px)`;
        sheetRef.current.style.transition = "none";
      }
    },
    [isDragging, dragStartY, currentTranslateY]
  );

  // Handle drag end - snap to nearest snap point
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !sheetRef.current) return;

    setIsDragging(false);

    // Restore body scroll
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }

    // Determine which snap point to use based on current position
    const currentY = currentTranslateY;
    const distances: Record<ISnapPoint, number> = {
      dismiss: Math.abs(currentY - snapPositions.dismiss),
      partial: Math.abs(currentY - snapPositions.partial),
      full: Math.abs(currentY - snapPositions.full),
    };

    // Find nearest snap point
    const nearestSnapPoint = (
      Object.entries(distances) as [ISnapPoint, number][]
    ).reduce(
      (min, [point, distance]) => (distance < distances[min] ? point : min),
      "full" as ISnapPoint
    );

    // If dragging down fast or past dismiss threshold, always dismiss
    const dragVelocity = currentTranslateY - (snapPositions[snapPoint] || 0);
    const dismissThreshold = windowHeight * 0.3; // 30% of screen height
    if ((dragVelocity > 100 || currentY > dismissThreshold) && dismissible) {
      handleClose();
      return;
    }

    // Snap to nearest point
    setSnapPoint(nearestSnapPoint);
    setCurrentTranslateY(snapPositions[nearestSnapPoint]);

    // Animate to snap position
    if (sheetRef.current) {
      sheetRef.current.style.transition =
        "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      sheetRef.current.style.transform = `translateY(${snapPositions[nearestSnapPoint]}px)`;
    }

    // If snapped to dismiss, close the sheet
    if (nearestSnapPoint === "dismiss") {
      setTimeout(() => handleClose(), 300);
    }
  }, [
    isDragging,
    currentTranslateY,
    snapPositions,
    snapPoint,
    dismissible,
    handleClose,
    windowHeight,
  ]);

  // Touch event handlers - only for drag handle and header
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      // Only allow drag from header area or drag handle
      const target = e.target as HTMLElement;
      const isHeaderArea =
        target.closest("header") || target.closest("[data-drag-handle]");
      if (isHeaderArea) {
        handleDragStart(e.touches[0].clientY);
      }
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      e.preventDefault(); // Prevent scrolling
      handleDragMove(e.touches[0].clientY);
    },
    [isDragging, handleDragMove]
  );

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  // Mouse event handlers (for desktop drag)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Update transform when snap point changes (programmatically)
  useEffect(() => {
    if (!isDragging && sheetRef.current) {
      const position = snapPositions[snapPoint];
      setCurrentTranslateY(position);
      sheetRef.current.style.transition =
        "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      sheetRef.current.style.transform = `translateY(${position}px)`;
    }
  }, [snapPoint, snapPositions, isDragging]);

  // Use focus trap hook
  const { handleKeyDown } = useFocusTrap({
    enabled: open,
    containerRef: sheetRef as React.RefObject<HTMLElement>,
    onEscape: dismissible ? handleClose : undefined,
  });

  // Generate title ID for aria-labelledby if title is provided
  const titleId = useMemo(
    () =>
      title
        ? `bottom-sheet-title-${Math.random().toString(36).substr(2, 9)}`
        : undefined,
    [title]
  );
  const finalAriaLabelledBy = ariaLabelledBy || titleId;

  // Calculate overlay opacity based on drag position (must be before early returns)
  const overlayOpacity = useMemo(() => {
    if (!isDragging || !windowHeight) return 1;
    const dragProgress = currentTranslateY / windowHeight;
    return Math.max(0.3, 1 - dragProgress * 0.7);
  }, [isDragging, currentTranslateY, windowHeight]);

  // Lock body scroll when sheet is open (must be before early returns)
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

  // Don't render on server when closed
  if (!isMounted && !open) return null;

  // If closed don't render
  if (!open) return null;

  const baseClasses = cn(
    "bg-surface border border-border rounded-t-2xl rounded-b-none",
    "shadow-lg outline-none",
    "flex flex-col overflow-hidden",
    "fixed left-0 right-0 bottom-0",
    "w-full max-h-[90vh]",
    !isDragging && "motion-safe:transition-transform motion-safe:duration-300",
    className
  );

  const dragHandle = showDragHandle ? (
    <div
      data-drag-handle
      className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing touch-none select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>
      <div className="w-12 h-1.5 bg-text-muted/30 rounded-full" />
    </div>
  ) : null;

  const sheetContent = (
    <>
      {/* Custom overlay with dynamic opacity */}
      {open && (
        <div
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm",
            "motion-safe:transition-opacity motion-safe:duration-300",
            isDragging && "transition-opacity duration-150"
          )}
          style={{
            zIndex: sheetZIndex - 1,
            opacity: overlayOpacity,
            pointerEvents: dismissible ? "auto" : "none",
          }}
          data-state={open ? "open" : "closed"}
          onClick={(e) => {
            // Only dismiss if clicking directly on overlay, not children
            if (e.target === e.currentTarget && dismissible) {
              handleClose();
            }
          }}
          aria-hidden="true"
        />
      )}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={finalAriaLabelledBy}
        data-state={open ? "open" : "closed"}
        data-dragging={isDragging ? "true" : "false"}
        className={baseClasses}
        style={{
          ...style,
          zIndex: sheetZIndex,
          transform: `translateY(${currentTranslateY}px)`,
        }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}>
        {/* Drag Handle */}
        {dragHandle}

        {/* Header - Always rendered */}
        <header
          className={cn(
            "flex items-center justify-between gap-4 px-6 py-4 border-b border-border",
            showDragHandle && "pt-0",
            "cursor-grab active:cursor-grabbing touch-none select-none"
          )}
          id={titleId}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>

          <IconButton clicked={handleClose}>
            <HiX className="size-5" />
          </IconButton>
        </header>

        <div
          ref={contentRef}
          className={cn(
            "px-6 py-4 overflow-y-auto",
            isDragging && "pointer-events-none overflow-hidden"
          )}
          style={{
            maxHeight: snapPoint === "partial" ? `${partialHeight}vh` : "none",
            touchAction: isDragging ? "none" : "auto",
          }}>
          {children}
        </div>

        {footerButtons && footerButtons.length > 0 && (
          <footer
            className={
              "flex items-center gap-3 px-6 py-4 border-t border-border justify-end "
            }>
            {footerButtons?.map((buttonProps, index) => (
              <Button
                key={index}
                {...buttonProps}
              />
            ))}
          </footer>
        )}
      </div>
    </>
  );

  // Portal rendering with SSR safety
  if (isMounted && typeof window !== "undefined") {
    const container = document.body;
    return createPortal(sheetContent, container);
  }

  // Fallback for SSR or non-portal mode
  if (!isMounted) return null;
  return sheetContent;
}
