import { useEffect, useState } from "react";

export type PlacementSide = "top" | "bottom" | "left" | "right";
export type PlacementAlignment = "start" | "center" | "end";

export type FloatingPlacement = {
  top: number;
  left: number;
  side: PlacementSide;
  alignment: PlacementAlignment;
  maxWidth?: number;
  maxHeight?: number;
} | null;

export type PlacementStrategy =
  | "auto" // Automatically choose best side
  | "prefer-top"
  | "prefer-bottom"
  | "prefer-bottom-then-top" // Try bottom, then top, then left/right
  | "prefer-left"
  | "prefer-right";

type UseFloatingPlacementOptions = {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
  spacing?: number;
  preferredSide?: PlacementSide;
  strategy?: PlacementStrategy;
  align?: PlacementAlignment;
  matchWidth?: boolean; // Match content width to trigger width (for dropdowns)
  estimatedWidth?: number;
  estimatedHeight?: number;
  offset?: { x?: number; y?: number }; // Additional offset
};

/**
 * Generic hook for calculating smart floating element placement
 * 
 * Works for dropdowns, tooltips, popovers, and other floating UI elements.
 * 
 * Features:
 * - Automatically positions element to stay within viewport
 * - Flips to opposite side based on available space
 * - Aligns content relative to trigger (start/center/end)
 * - Updates position on scroll and resize
 * - Configurable placement strategy and preferences
 * 
 * @param options - Configuration options
 * @returns Calculated floating position or null
 * 
 * @example
 * ```tsx
 * // For a dropdown (prefers bottom, matches width)
 * const position = useFloatingPlacement({
 *   isOpen,
 *   triggerRef,
 *   contentRef,
 *   preferredSide: "bottom",
 *   matchWidth: true,
 * });
 * 
 * // For a tooltip (prefers top, centers on trigger)
 * const position = useFloatingPlacement({
 *   isOpen,
 *   triggerRef,
 *   contentRef,
 *   preferredSide: "top",
 *   align: "center",
 *   spacing: 8,
 * });
 * ```
 */
export function useFloatingPlacement({
  isOpen,
  triggerRef,
  contentRef,
  spacing = 4,
  preferredSide = "bottom",
  strategy = "auto",
  align = "start",
  matchWidth = false,
  estimatedWidth,
  estimatedHeight = 200,
  offset = { x: 0, y: 0 },
}: UseFloatingPlacementOptions): FloatingPlacement {
  const [position, setPosition] = useState<FloatingPlacement>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const calculatePosition = (
      triggerRect: DOMRect,
      contentRect?: DOMRect
    ): FloatingPlacement => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Use actual content size if available, otherwise use estimates
      const contentHeight = contentRect?.height ?? estimatedHeight;
      const contentWidth = contentRect?.width ?? estimatedWidth ?? triggerRect.width;

      // Determine which side to use based on strategy
      const determineSide = (): PlacementSide => {
        const spaceMap = {
          top: triggerRect.top,
          bottom: viewportHeight - triggerRect.bottom,
          left: triggerRect.left,
          right: viewportWidth - triggerRect.right,
        };

        const checkSide = (side: PlacementSide): boolean => {
          const requiredSpace = side === "top" || side === "bottom" 
            ? contentHeight 
            : contentWidth;
          return spaceMap[side] >= requiredSpace + spacing;
        };

        if (strategy === "auto") {
          // Calculate space on each side
          const spaces = [
            { side: "top" as PlacementSide, space: spaceMap.top },
            { side: "bottom" as PlacementSide, space: spaceMap.bottom },
            { side: "left" as PlacementSide, space: spaceMap.left },
            { side: "right" as PlacementSide, space: spaceMap.right },
          ];

          // Sort by space and prefer vertical (top/bottom) for most use cases
          spaces.sort((a, b) => {
            const aIsVertical = a.side === "top" || a.side === "bottom";
            const bIsVertical = b.side === "top" || b.side === "bottom";
            
            // Prefer vertical if space is similar
            if (Math.abs(a.space - b.space) < 50) {
              return aIsVertical ? -1 : 1;
            }
            return b.space - a.space;
          });

          return spaces[0].side;
        }

        if (strategy === "prefer-bottom-then-top") {
          // Try bottom first
          if (checkSide("bottom")) {
            return "bottom";
          }
          // Try top second
          if (checkSide("top")) {
            return "top";
          }
          // Try left or right (whichever has more space)
          if (spaceMap.left >= spaceMap.right) {
            return checkSide("left") ? "left" : "right";
          } else {
            return checkSide("right") ? "right" : "left";
          }
        }

        // Use preferred side, but flip if not enough space
        const preferred = preferredSide;
        const requiredSpace = preferred === "top" || preferred === "bottom" 
          ? contentHeight 
          : contentWidth;

        if (spaceMap[preferred] >= requiredSpace + spacing) {
          return preferred;
        }

        // Flip to opposite side if preferred doesn't fit
        const opposites: Record<PlacementSide, PlacementSide> = {
          top: "bottom",
          bottom: "top",
          left: "right",
          right: "left",
        };

        const opposite = opposites[preferred];
        if (spaceMap[opposite] >= requiredSpace + spacing) {
          return opposite;
        }

        // If neither fits, use the side with most space
        const bestSide = Object.entries(spaceMap).reduce((best, [side, space]) => 
          space > best.space ? { side: side as PlacementSide, space } : best,
          { side: preferred, space: spaceMap[preferred] }
        );

        return bestSide.side;
      };

      const side = determineSide();
      let top = 0;
      let left = 0;
      let alignment: PlacementAlignment = align;

      // Calculate position based on side
      switch (side) {
        case "top": {
          top = triggerRect.top - contentHeight - spacing;
          const triggerCenterX = triggerRect.left + triggerRect.width / 2;
          
          if (align === "center") {
            left = triggerCenterX - contentWidth / 2;
            alignment = "center";
          } else if (align === "end") {
            left = triggerRect.right - contentWidth;
            alignment = "end";
          } else {
            left = triggerRect.left;
            alignment = "start";
          }
          break;
        }
        case "bottom": {
          top = triggerRect.bottom + spacing;
          const triggerCenterX = triggerRect.left + triggerRect.width / 2;
          
          if (align === "center") {
            left = triggerCenterX - contentWidth / 2;
            alignment = "center";
          } else if (align === "end") {
            left = triggerRect.right - contentWidth;
            alignment = "end";
          } else {
            left = triggerRect.left;
            alignment = "start";
          }
          break;
        }
        case "left": {
          left = triggerRect.left - contentWidth - spacing;
          const triggerCenterY = triggerRect.top + triggerRect.height / 2;
          
          if (align === "center") {
            top = triggerCenterY - contentHeight / 2;
            alignment = "center";
          } else if (align === "end") {
            top = triggerRect.bottom - contentHeight;
            alignment = "end";
          } else {
            top = triggerRect.top;
            alignment = "start";
          }
          break;
        }
        case "right": {
          left = triggerRect.right + spacing;
          const triggerCenterY = triggerRect.top + triggerRect.height / 2;
          
          if (align === "center") {
            top = triggerCenterY - contentHeight / 2;
            alignment = "center";
          } else if (align === "end") {
            top = triggerRect.bottom - contentHeight;
            alignment = "end";
          } else {
            top = triggerRect.top;
            alignment = "start";
          }
          break;
        }
      }

      // Apply width matching for dropdowns
      if (matchWidth && (side === "top" || side === "bottom")) {
        left = triggerRect.left;
        alignment = "start";
      }

      // Keep within viewport bounds
      if (left < spacing) {
        left = spacing;
        alignment = "start";
      }
      if (left + contentWidth > viewportWidth - spacing) {
        left = viewportWidth - contentWidth - spacing;
        alignment = "end";
      }
      if (top < spacing) {
        top = spacing;
      }
      if (top + contentHeight > viewportHeight - spacing) {
        top = viewportHeight - contentHeight - spacing;
      }

      // Apply offset
      top += offset.y ?? 0;
      left += offset.x ?? 0;

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

      return {
        top,
        left,
        side,
        alignment,
        maxHeight: maxHeight > 0 ? maxHeight : undefined,
        maxWidth: maxWidth > 0 ? maxWidth : undefined,
      };
    };

    // Initial position calculation with estimates
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const position = calculatePosition(rect);
      setPosition(position);
    };

    // Fine-tune position after content is rendered and measured
    const fineTunePosition = () => {
      if (!contentRef.current || !triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const position = calculatePosition(triggerRect, contentRect);
      setPosition(position);
    };

    // Initial position calculation
    updatePosition();

    // Fine-tune after a short delay to allow rendering
    const timeoutId = setTimeout(fineTunePosition, 10);

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
    spacing,
    preferredSide,
    strategy,
    align,
    matchWidth,
    estimatedHeight,
    estimatedWidth,
    offset.x,
    offset.y,
  ]);

  return position;
}

