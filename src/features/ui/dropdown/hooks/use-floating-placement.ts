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
  placement?: IPlacementOption[] | IPlacementOption; // Placement options to try in order
  spacing?: number;
  matchWidth?: boolean; // Match content width to trigger width (for dropdowns)
  offset?: { x?: number; y?: number }; // Additional offset
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
 * - Allows overflow if none of the options fit
 *
 * @param options - Configuration options
 * @returns Calculated floating position or null
 */
export function useFloatingPlacement({
  isOpen,
  triggerRef,
  contentRef,
  placement,
  spacing = 4,
  matchWidth = false,
  offset = { x: 0, y: 0 },
}: IUseFloatingPlacementOptions): IFloatingPlacement {
  const [position, setPosition] = useState<IFloatingPlacement>(null);

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
      const contentWidth = contentRect.width;

      // Try each placement option in order until one fits
      let finalPosition: IFloatingPlacement | null = null;

      for (const side of normalizedPlacement) {
        let top = 0;
        let left = 0;
        let alignment: IPlacementAlignment = "start";

        // Calculate position based on side
        switch (side) {
          case "top": {
            top = triggerRect.top - contentHeight - spacing;
            left = triggerRect.left;
            alignment = "start";
            break;
          }
          case "bottom": {
            top = triggerRect.bottom + spacing;
            left = triggerRect.left;
            alignment = "start";
            break;
          }
          case "left": {
            left = triggerRect.left - contentWidth - spacing;
            top = triggerRect.top;
            alignment = "start";
            break;
          }
          case "right": {
            left = triggerRect.right + spacing;
            top = triggerRect.top;
            alignment = "start";
            break;
          }
        }

        // Apply width matching for dropdowns
        if (matchWidth && (side === "top" || side === "bottom")) {
          left = triggerRect.left;
          alignment = "start";
        }

        // Apply offset
        top += offset.y ?? 0;
        left += offset.x ?? 0;

        // Check if this placement fits within viewport (with spacing)
        const fitsInViewport =
          left >= spacing &&
          left + contentWidth <= viewportWidth - spacing &&
          top >= spacing &&
          top + contentHeight <= viewportHeight - spacing;

        // Calculate max dimensions
        const maxHeight =
          side === "top"
            ? triggerRect.top - spacing - 8
            : side === "bottom"
              ? viewportHeight - top - 8
              : viewportHeight - 16;

        const maxWidth =
          side === "left"
            ? triggerRect.left - spacing - 8
            : side === "right"
              ? viewportWidth - left - 8
              : viewportWidth - 16;

        const position: IFloatingPlacement = {
          top,
          left,
          side,
          alignment,
          maxHeight: maxHeight > 0 ? maxHeight : undefined,
          maxWidth: maxWidth > 0 ? maxWidth : undefined,
        };

        // If it fits, use this placement
        if (fitsInViewport) {
          return position;
        }

        // Otherwise, save it as fallback (will use last attempted if none fit)
        finalPosition = position;
      }

      // If none fit, return the last attempted placement (allows overflow)
      return finalPosition;
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
    spacing,
    matchWidth,
    offset?.x,
    offset?.y,
  ]);

  return position;
}
