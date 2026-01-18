import {
  useFloatingPlacement,
  type IPlacementOption,
} from "../dropdown/hooks/use-floating-placement";
import { useEffect, useState } from "react";

export type ITooltipPosition = {
  top: number;
  left: number;
  maxWidth?: number;
} | null;

type IUseTooltipPlacementOptions = {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
  placement?: IPlacementOption[] | IPlacementOption;
};

/**
 * Hook for calculating smart tooltip placement with centered alignment
 *
 * This is a convenience wrapper around useFloatingPlacement with tooltip-specific defaults.
 *
 * Features:
 * - Tries placement options in order until one fits on screen
 * - Uses actual element dimensions for accurate calculations
 * - Updates position on scroll and resize
 * - Always centers tooltip relative to trigger (horizontally for top/bottom, vertically for left/right)
 * - Menu must always stay fully inside viewport with 8px margin
 *
 * @param options - Configuration options
 * @returns Calculated tooltip position or null
 */
export function useTooltipPlacement({
  isOpen,
  triggerRef,
  contentRef,
  placement,
}: IUseTooltipPlacementOptions): ITooltipPosition {
  // Default to "auto" for tooltips (tries bottom, top, left, right in order)
  const placementOptions: IPlacementOption[] | IPlacementOption =
    placement !== undefined ? placement : "auto";

  // Get base floating position
  const floatingPosition = useFloatingPlacement({
    isOpen,
    triggerRef,
    contentRef,
    placement: placementOptions,
    matchWidth: false, // Tooltips don't match trigger width
  });

  const [centeredPosition, setCenteredPosition] = useState<ITooltipPosition>(null);

  useEffect(() => {
    if (!isOpen || !floatingPosition || !triggerRef.current || !contentRef.current) {
      setCenteredPosition(null);
      return;
    }

    // Use requestAnimationFrame to ensure content is measured
    const updatePosition = () => {
      if (!triggerRef.current || !contentRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const side = floatingPosition.side;

      // Center the tooltip relative to the trigger
      let centeredTop = floatingPosition.top;
      let centeredLeft = floatingPosition.left;

      if (side === "top" || side === "bottom") {
        // For top/bottom placements, center horizontally
        centeredLeft = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        
        // Ensure it stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const margin = 8;
        if (centeredLeft < margin) {
          centeredLeft = margin;
        } else if (centeredLeft + contentRect.width > viewportWidth - margin) {
          centeredLeft = viewportWidth - contentRect.width - margin;
        }
      } else {
        // For left/right placements, center vertically
        centeredTop = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        
        // Ensure it stays within viewport bounds
        const viewportHeight = window.innerHeight;
        const margin = 8;
        if (centeredTop < margin) {
          centeredTop = margin;
        } else if (centeredTop + contentRect.height > viewportHeight - margin) {
          centeredTop = viewportHeight - contentRect.height - margin;
        }
      }

      setCenteredPosition({
        top: centeredTop,
        left: centeredLeft,
        maxWidth: floatingPosition.maxWidth,
      });
    };

    // Small delay to ensure content is rendered and measured
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updatePosition);
    }, 0);

    // Update on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, floatingPosition, triggerRef, contentRef]);

  return centeredPosition;
}
