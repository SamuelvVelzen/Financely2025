import { useEffect, useState } from "react";

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
} | null;

const VIEWPORT_MARGIN = 8;

/**
 * Normalizes placement option to an array of placement sides
 */
function normalizePlacement(
  placement?: IPlacementOption[] | IPlacementOption,
  defaultPlacement: IPlacementSide[] = ["bottom", "top", "left", "right"]
): IPlacementSide[] {
  if (!placement) {
    return defaultPlacement;
  }

  if (placement === "auto") {
    return ["bottom", "top", "left", "right"];
  }

  if (Array.isArray(placement)) {
    // Expand "auto" if present in array, otherwise filter to valid sides
    const result: IPlacementSide[] = [];
    for (const option of placement) {
      if (option === "auto") {
        result.push("bottom", "top", "left", "right");
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
  matchWidth?: boolean; // Match content width to trigger width (for dropdowns)
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

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const normalizedPlacement = normalizePlacement(placement, [
      "bottom",
      "top",
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

      // Try each placement option in order until one fits
      let bestPosition: IFloatingPlacement | null = null;
      let minOverflow = Infinity;

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

        if (!mainAxisFits) {
          // This side doesn't fit on main axis, skip it
          continue;
        }

        // Try alignment variants for this side
        let foundValidAlignment = false;

        if (side === "bottom" || side === "top") {
          // For vertical placements, try left-aligned first, then right-aligned
          // Left-aligned: menu.left = trigger.left - Must not overflow right edge
          // Right-aligned: menu.right = trigger.right - Must not overflow left edge
          let leftAlignedLeft = triggerRect.left;
          let rightAlignedLeft = triggerRect.right - contentWidth;

          // If matchWidth is true, prefer matching trigger width, but allow content to be wider if needed
          if (matchWidth && contentWidth > triggerRect.width) {
            // Content is wider than trigger - try to align left edge, but ensure it fits
            leftAlignedLeft = triggerRect.left;
            // For right-aligned, align right edge of dropdown with right edge of trigger
            rightAlignedLeft = triggerRect.right - contentWidth;
          } else if (matchWidth) {
            // Content fits within trigger width - use trigger width for alignment
            leftAlignedLeft = triggerRect.left;
            rightAlignedLeft = triggerRect.right - triggerRect.width;
          }

          // Check left-aligned: must not overflow right edge
          const leftAlignedFits =
            leftAlignedLeft >= VIEWPORT_MARGIN &&
            leftAlignedLeft + contentWidth <= viewportWidth - VIEWPORT_MARGIN;

          // Check right-aligned: must not overflow left edge
          const rightAlignedFits =
            rightAlignedLeft >= VIEWPORT_MARGIN &&
            rightAlignedLeft + contentWidth <= viewportWidth - VIEWPORT_MARGIN;

          const alignments: Array<{
            left: number;
            alignment: IPlacementAlignment;
            fits: boolean;
          }> = [
            {
              left: leftAlignedLeft,
              alignment: "start",
              fits: leftAlignedFits,
            },
            {
              left: rightAlignedLeft,
              alignment: "end",
              fits: rightAlignedFits,
            },
          ];

          for (const { left, alignment, fits } of alignments) {
            // Check if this alignment fits within viewport
            const fitsHorizontally = fits;

            if (fitsHorizontally) {
              const top =
                side === "bottom"
                  ? triggerRect.bottom // Zero gap - touching bottom edge
                  : triggerRect.top - contentHeight; // Zero gap - touching top edge

              // Verify top is within bounds (should be if mainAxisFits passed)
              const topFits =
                top >= VIEWPORT_MARGIN &&
                top + contentHeight <= viewportHeight - VIEWPORT_MARGIN;

              if (!topFits) {
                // Top doesn't fit, skip this alignment
                continue;
              }

              // Use exact position - no clamping when it fits
              // Calculate maxHeight for scrolling
              const maxHeight =
                side === "bottom"
                  ? viewportHeight - top - VIEWPORT_MARGIN
                  : triggerRect.top - VIEWPORT_MARGIN;

              const position: IFloatingPlacement = {
                top,
                left, // Use exact left position - no clamping
                side,
                alignment,
                maxHeight: maxHeight > 0 ? maxHeight : undefined,
                maxWidth: viewportWidth - VIEWPORT_MARGIN * 2,
              };

              bestPosition = position;
              foundValidAlignment = true;
              break;
            } else {
              // Calculate overflow for this alignment
              const leftOverflow = Math.max(0, VIEWPORT_MARGIN - left);
              const rightOverflow = Math.max(
                0,
                left + contentWidth - (viewportWidth - VIEWPORT_MARGIN)
              );
              const overflow = leftOverflow + rightOverflow;

              if (overflow < minOverflow) {
                minOverflow = overflow;
                // Clamp position to viewport
                const clampedLeft = Math.max(
                  VIEWPORT_MARGIN,
                  Math.min(viewportWidth - contentWidth - VIEWPORT_MARGIN, left)
                );

                const top =
                  side === "bottom"
                    ? triggerRect.bottom
                    : triggerRect.top - contentHeight;

                const maxHeight =
                  side === "bottom"
                    ? viewportHeight - top - VIEWPORT_MARGIN
                    : triggerRect.top - VIEWPORT_MARGIN;

                bestPosition = {
                  top,
                  left: clampedLeft,
                  side,
                  alignment,
                  maxHeight: maxHeight > 0 ? maxHeight : undefined,
                  maxWidth: viewportWidth - VIEWPORT_MARGIN * 2,
                };
              }
            }
          }
        } else {
          // For horizontal placements (left/right), try top-aligned first, then bottom-aligned
          const alignments: Array<{
            top: number;
            alignment: IPlacementAlignment;
          }> = [
            { top: triggerRect.top, alignment: "start" },
            { top: triggerRect.bottom - contentHeight, alignment: "end" },
          ];

          for (const { top, alignment } of alignments) {
            // Check if this alignment fits within viewport
            const fitsVertically =
              top >= VIEWPORT_MARGIN &&
              top + contentHeight <= viewportHeight - VIEWPORT_MARGIN;

            if (fitsVertically) {
              const left =
                side === "right"
                  ? triggerRect.right // Zero gap - touching right edge
                  : triggerRect.left - contentWidth; // Zero gap - touching left edge

              // Ensure left is within viewport bounds
              const clampedLeft = Math.max(
                VIEWPORT_MARGIN,
                Math.min(viewportWidth - contentWidth - VIEWPORT_MARGIN, left)
              );

              // Ensure top is within viewport bounds (double-check and clamp)
              const clampedTop = Math.max(
                VIEWPORT_MARGIN,
                Math.min(viewportHeight - contentHeight - VIEWPORT_MARGIN, top)
              );

              // Calculate maxWidth for scrolling
              const maxWidth =
                side === "right"
                  ? viewportWidth - clampedLeft - VIEWPORT_MARGIN
                  : triggerRect.left - VIEWPORT_MARGIN;

              const position: IFloatingPlacement = {
                top: clampedTop,
                left: clampedLeft,
                side,
                alignment,
                maxHeight: viewportHeight - VIEWPORT_MARGIN * 2,
                maxWidth: maxWidth > 0 ? maxWidth : undefined,
              };

              bestPosition = position;
              foundValidAlignment = true;
              break;
            } else {
              // Calculate overflow for this alignment
              const topOverflow = Math.max(0, VIEWPORT_MARGIN - top);
              const bottomOverflow = Math.max(
                0,
                top + contentHeight - (viewportHeight - VIEWPORT_MARGIN)
              );
              const overflow = topOverflow + bottomOverflow;

              if (overflow < minOverflow) {
                minOverflow = overflow;
                // Clamp position to viewport
                const clampedTop = Math.max(
                  VIEWPORT_MARGIN,
                  Math.min(
                    viewportHeight - contentHeight - VIEWPORT_MARGIN,
                    top
                  )
                );

                const left =
                  side === "right"
                    ? triggerRect.right
                    : triggerRect.left - contentWidth;

                const maxWidth =
                  side === "right"
                    ? viewportWidth - left - VIEWPORT_MARGIN
                    : triggerRect.left - VIEWPORT_MARGIN;

                bestPosition = {
                  top: clampedTop,
                  left,
                  side,
                  alignment,
                  maxHeight: viewportHeight - VIEWPORT_MARGIN * 2,
                  maxWidth: maxWidth > 0 ? maxWidth : undefined,
                };
              }
            }
          }
        }

        // If we found a valid alignment that fully fits, use it immediately
        if (foundValidAlignment && bestPosition) {
          return bestPosition;
        }
      }

      // If no side fully fits, return the best position (with minimal overflow, clamped)
      // Final safety clamp to ensure position is always within viewport
      if (bestPosition) {
        const finalLeft = Math.max(
          VIEWPORT_MARGIN,
          Math.min(
            viewportWidth - contentWidth - VIEWPORT_MARGIN,
            bestPosition.left
          )
        );
        const finalTop = Math.max(
          VIEWPORT_MARGIN,
          Math.min(
            viewportHeight - contentHeight - VIEWPORT_MARGIN,
            bestPosition.top
          )
        );

        return {
          ...bestPosition,
          left: finalLeft,
          top: finalTop,
        };
      }

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
  }, [isOpen, triggerRef, contentRef, placement, matchWidth]);

  return position;
}
