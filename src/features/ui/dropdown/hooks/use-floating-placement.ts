import { useEffect, useRef, useState } from "react";

export type IPlacementSide = "top" | "bottom" | "left" | "right";
export type IPlacementAlignment = "start" | "center" | "end";

export type IPlacementOption = "top" | "bottom" | "left" | "right" | "auto";

export type IFloatingPlacement = {
  top: number;
  left: number;
  side: IPlacementSide;
  alignment: IPlacementAlignment;
  maxWidth?: number;
  maxHeight?: number;
  width?: number; // Width to apply when matchWidth is true (locked on open)
} | null;

const VIEWPORT_MARGIN = 8;

/**
 * Normalizes placement option to an array of placement sides
 */
function normalizePlacement(
  placement?: IPlacementOption[] | IPlacementOption,
  defaultPlacement: IPlacementSide[] = ["top", "bottom", "left", "right"]
): IPlacementSide[] {
  if (!placement) {
    return defaultPlacement;
  }

  if (placement === "auto") {
    return ["top", "bottom", "left", "right"];
  }

  if (Array.isArray(placement)) {
    // Expand "auto" if present in array, otherwise filter to valid sides
    const result: IPlacementSide[] = [];
    for (const option of placement) {
      if (option === "auto") {
        result.push("top", "bottom", "left", "right");
      } else {
        result.push(option);
      }
    }
    return result;
  }

  return [placement];
}

type IUseFloatingPlacementOptions = {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
  placement?: IPlacementOption[] | IPlacementOption;
  matchWidth?: boolean; // Match content width to trigger width (locks width on open for dropdowns)
};

/**
 * Generic hook for calculating smart floating element placement
 *
 * Works for dropdowns, tooltips, popovers, and other floating UI elements.
 *
 * Features:
 * - Tries placement options in order until one fits on screen
 * - Uses actual element dimensions for accurate calculations
 * - Updates position on scroll and resize
 * - Menu must always stay fully inside viewport with 8px margin
 * - Zero gap between trigger and menu (touching edges)
 *
 * @param options - Configuration options
 * @returns Calculated floating position or null
 */
export function useFloatingPlacement({
  isOpen,
  triggerRef,
  contentRef,
  placement,
  matchWidth = false,
}: IUseFloatingPlacementOptions): IFloatingPlacement {
  const [position, setPosition] = useState<IFloatingPlacement>(null);
  const [lockedTriggerWidth, setLockedTriggerWidth] = useState<
    number | undefined
  >(undefined);
  const wasOpenRef = useRef(false);

  // Handle width locking when matchWidth is enabled
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && matchWidth && triggerRef.current) {
      // Dropdown just opened - capture the trigger width
      const triggerRect = triggerRef.current.getBoundingClientRect();
      // Wait for content to be measured before locking width
      const timeoutId = setTimeout(() => {
        const contentRect = contentRef.current?.getBoundingClientRect();
        // Only lock width if content fits within trigger width
        if (contentRect && contentRect.width <= triggerRect.width) {
          setLockedTriggerWidth(triggerRect.width);
        } else {
          setLockedTriggerWidth(undefined);
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    } else if (!isOpen && wasOpenRef.current && matchWidth) {
      // Dropdown just closed - clear the locked width
      setLockedTriggerWidth(undefined);
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, matchWidth, triggerRef, contentRef]);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const normalizedPlacement = normalizePlacement(placement, [
      "top",
      "bottom",
      "left",
      "right",
    ]);

    const calculatePosition = (
      triggerRect: DOMRect,
      contentRect?: DOMRect
    ): IFloatingPlacement => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Must have actual content size - wait for it to be measured
      if (!contentRect) {
        return null;
      }

      const contentHeight = contentRect.height;
      // Use actual content width, but when matchWidth is true, we'll try to align with trigger
      const contentWidth = contentRect.width;

      // Check if only one placement is provided (enforce it)
      const isSinglePlacement = normalizedPlacement.length === 1;
      const singlePlacement = isSinglePlacement ? normalizedPlacement[0] : null;

      // Try each placement option in order until one fits
      let bestPosition: IFloatingPlacement | null = null;
      let bestOverflow = Infinity;
      let bestFitsFully = false;

      for (const side of normalizedPlacement) {
        // Check if main axis fits (vertical for bottom/top, horizontal for left/right)
        const mainAxisFits =
          side === "bottom"
            ? triggerRect.bottom + contentHeight <=
              viewportHeight - VIEWPORT_MARGIN
            : side === "top"
              ? triggerRect.top - contentHeight >= VIEWPORT_MARGIN
              : side === "right"
                ? triggerRect.right + contentWidth <=
                  viewportWidth - VIEWPORT_MARGIN
                : triggerRect.left - contentWidth >= VIEWPORT_MARGIN;

        // If single placement is enforced, always use it even if main axis doesn't fit
        // Otherwise, skip sides that don't fit on main axis
        if (!isSinglePlacement && !mainAxisFits) {
          continue;
        }

        if (side === "bottom" || side === "top") {
          // For vertical placements, evaluate both left and right alignments
          // Left-aligned: menu.left = trigger.left
          // Right-aligned: menu.right = trigger.right
          let leftAlignedLeft = triggerRect.left;
          let rightAlignedLeft = triggerRect.right - contentWidth;

          // If matchWidth is true, use locked width if available, otherwise use current trigger width
          if (matchWidth) {
            const effectiveTriggerWidth =
              lockedTriggerWidth ?? triggerRect.width;

            if (contentWidth > effectiveTriggerWidth) {
              // Content is wider than trigger - try to align left edge, but ensure it fits
              leftAlignedLeft = triggerRect.left;
              // For right-aligned, align right edge of dropdown with right edge of trigger
              rightAlignedLeft = triggerRect.right - contentWidth;
            } else {
              // Content fits within trigger width - use effective trigger width for alignment
              leftAlignedLeft = triggerRect.left;
              rightAlignedLeft = triggerRect.right - effectiveTriggerWidth;
            }
          }

          // Calculate positions for both alignments
          const top =
            side === "bottom"
              ? triggerRect.bottom // Zero gap - touching bottom edge
              : triggerRect.top - contentHeight; // Zero gap - touching top edge

          const alignments: Array<{
            left: number;
            alignment: IPlacementAlignment;
          }> = [
            { left: leftAlignedLeft, alignment: "start" },
            { left: rightAlignedLeft, alignment: "end" },
          ];

          // Evaluate both alignments and pick the best one
          for (const { left, alignment } of alignments) {
            // Calculate overflow for this alignment
            const leftOverflow = Math.max(0, VIEWPORT_MARGIN - left);
            const rightOverflow = Math.max(
              0,
              left + contentWidth - (viewportWidth - VIEWPORT_MARGIN)
            );
            const horizontalOverflow = leftOverflow + rightOverflow;

            // Check if top fits vertically
            const topOverflow = Math.max(0, VIEWPORT_MARGIN - top);
            const bottomOverflow = Math.max(
              0,
              top + contentHeight - (viewportHeight - VIEWPORT_MARGIN)
            );
            const verticalOverflow = topOverflow + bottomOverflow;

            const totalOverflow = horizontalOverflow + verticalOverflow;
            const fitsFully = totalOverflow === 0;

            // Prefer alignments that fully fit, or if both overflow, choose the one with less overflow
            // Also prefer this side if it's better than what we've seen so far
            const isBetter =
              (fitsFully && !bestFitsFully) ||
              (fitsFully && bestFitsFully && totalOverflow < bestOverflow) ||
              (!fitsFully && !bestFitsFully && totalOverflow < bestOverflow);

            if (isBetter) {
              bestOverflow = totalOverflow;
              bestFitsFully = fitsFully;

              // Clamp position to viewport
              // For single placements, respect the side direction:
              // - "bottom": only clamp downward (don't move above trigger)
              // - "top": only clamp upward (don't move below trigger)
              const clampedLeft = Math.max(
                VIEWPORT_MARGIN,
                Math.min(viewportWidth - contentWidth - VIEWPORT_MARGIN, left)
              );

              let clampedTop: number;
              if (isSinglePlacement && side === "bottom") {
                // For forced bottom placement, only clamp downward
                clampedTop = Math.min(
                  viewportHeight - contentHeight - VIEWPORT_MARGIN,
                  top
                );
                // Ensure it's at least at the trigger bottom (don't move above)
                clampedTop = Math.max(clampedTop, triggerRect.bottom);
              } else if (isSinglePlacement && side === "top") {
                // For forced top placement, only clamp upward
                clampedTop = Math.max(VIEWPORT_MARGIN, top);
                // Ensure it's at most at the trigger top minus content height (don't move below)
                clampedTop = Math.min(
                  clampedTop,
                  triggerRect.top - contentHeight
                );
              } else {
                // For auto or multiple placements, clamp both directions
                clampedTop = Math.max(
                  VIEWPORT_MARGIN,
                  Math.min(
                    viewportHeight - contentHeight - VIEWPORT_MARGIN,
                    top
                  )
                );
              }

              // Calculate maxHeight for scrolling
              const maxHeight =
                side === "bottom"
                  ? viewportHeight - clampedTop - VIEWPORT_MARGIN
                  : triggerRect.top - VIEWPORT_MARGIN;

              bestPosition = {
                top: clampedTop,
                left: clampedLeft,
                side,
                alignment,
                maxHeight: maxHeight > 0 ? maxHeight : undefined,
                maxWidth: viewportWidth - VIEWPORT_MARGIN * 2,
                width: matchWidth ? lockedTriggerWidth : undefined,
              };

              // If this alignment fits fully and we're not enforcing a single placement,
              // we can return early (best fit found)
              if (fitsFully && !isSinglePlacement) {
                return bestPosition;
              }
            }
          }
        } else {
          // For horizontal placements (left/right), evaluate both top and bottom alignments
          const left =
            side === "right"
              ? triggerRect.right // Zero gap - touching right edge
              : triggerRect.left - contentWidth; // Zero gap - touching left edge

          const alignments: Array<{
            top: number;
            alignment: IPlacementAlignment;
          }> = [
            { top: triggerRect.top, alignment: "start" },
            { top: triggerRect.bottom - contentHeight, alignment: "end" },
          ];

          // Evaluate both alignments and pick the best one
          for (const { top, alignment } of alignments) {
            // Calculate overflow for this alignment
            const topOverflow = Math.max(0, VIEWPORT_MARGIN - top);
            const bottomOverflow = Math.max(
              0,
              top + contentHeight - (viewportHeight - VIEWPORT_MARGIN)
            );
            const verticalOverflow = topOverflow + bottomOverflow;

            // Check if left fits horizontally
            const leftOverflow = Math.max(0, VIEWPORT_MARGIN - left);
            const rightOverflow = Math.max(
              0,
              left + contentWidth - (viewportWidth - VIEWPORT_MARGIN)
            );
            const horizontalOverflow = leftOverflow + rightOverflow;

            const totalOverflow = verticalOverflow + horizontalOverflow;
            const fitsFully = totalOverflow === 0;

            // Prefer alignments that fully fit, or if both overflow, choose the one with less overflow
            const isBetter =
              (fitsFully && !bestFitsFully) ||
              (fitsFully && bestFitsFully && totalOverflow < bestOverflow) ||
              (!fitsFully && !bestFitsFully && totalOverflow < bestOverflow);

            if (isBetter) {
              bestOverflow = totalOverflow;
              bestFitsFully = fitsFully;

              // Clamp position to viewport
              // For single placements, respect the side direction:
              // - "left": only clamp leftward (don't move right of trigger)
              // - "right": only clamp rightward (don't move left of trigger)
              let clampedLeft: number;
              if (isSinglePlacement && side === "right") {
                // For forced right placement, only clamp rightward
                clampedLeft = Math.min(
                  viewportWidth - contentWidth - VIEWPORT_MARGIN,
                  left
                );
                // Ensure it's at least at the trigger right (don't move left)
                clampedLeft = Math.max(clampedLeft, triggerRect.right);
              } else if (isSinglePlacement && side === "left") {
                // For forced left placement, only clamp leftward
                clampedLeft = Math.max(VIEWPORT_MARGIN, left);
                // Ensure it's at most at the trigger left minus content width (don't move right)
                clampedLeft = Math.min(
                  clampedLeft,
                  triggerRect.left - contentWidth
                );
              } else {
                // For auto or multiple placements, clamp both directions
                clampedLeft = Math.max(
                  VIEWPORT_MARGIN,
                  Math.min(viewportWidth - contentWidth - VIEWPORT_MARGIN, left)
                );
              }

              const clampedTop = Math.max(
                VIEWPORT_MARGIN,
                Math.min(viewportHeight - contentHeight - VIEWPORT_MARGIN, top)
              );

              // Calculate maxWidth for scrolling
              const maxWidth =
                side === "right"
                  ? viewportWidth - clampedLeft - VIEWPORT_MARGIN
                  : triggerRect.left - VIEWPORT_MARGIN;

              bestPosition = {
                top: clampedTop,
                left: clampedLeft,
                side,
                alignment,
                maxHeight: viewportHeight - VIEWPORT_MARGIN * 2,
                maxWidth: maxWidth > 0 ? maxWidth : undefined,
                width: matchWidth ? lockedTriggerWidth : undefined,
              };

              // If this alignment fits fully and we're not enforcing a single placement,
              // we can return early (best fit found)
              if (fitsFully && !isSinglePlacement) {
                return bestPosition;
              }
            }
          }
        }

        // If single placement is enforced, we must use this side (even if it doesn't fit perfectly)
        if (isSinglePlacement && bestPosition) {
          return bestPosition;
        }
      }

      // Return the best position found (with minimal overflow, clamped)
      return bestPosition;
    };

    // Wait for content to be rendered and measured before calculating position
    const updatePosition = () => {
      if (!contentRef.current || !triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const position = calculatePosition(triggerRect, contentRect);
      setPosition(position);
    };

    // Initial position calculation after a short delay to allow rendering
    const timeoutId = setTimeout(updatePosition, 10);

    // Update position on scroll and resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [
    isOpen,
    triggerRef,
    contentRef,
    placement,
    matchWidth,
    lockedTriggerWidth,
  ]);

  return position;
}
