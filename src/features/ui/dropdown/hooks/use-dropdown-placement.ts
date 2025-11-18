import { useFloatingPlacement } from "./use-floating-placement";

export type IDropdownPlacement =
  | "bottom"
  | "top"
  | "bottom-right"
  | "top-right";

export type IDropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: IDropdownPlacement;
} | null;

type IUseDropdownPlacementOptions = {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
  spacing?: number;
  estimatedHeight?: number;
  estimatedWidth?: number;
};

/**
 * Hook for calculating smart dropdown placement
 *
 * This is a convenience wrapper around useFloatingPlacement with dropdown-specific defaults.
 *
 * Features:
 * - Automatically positions dropdown to stay within viewport
 * - Flips above/below based on available space
 * - Aligns left/right to prevent overflow
 * - Updates position on scroll and resize
 *
 * @param options - Configuration options
 * @returns Calculated dropdown position or null
 */
export function useDropdownPlacement({
  isOpen,
  triggerRef,
  contentRef,
  spacing = 4,
  estimatedHeight = 200,
  estimatedWidth,
}: IUseDropdownPlacementOptions): IDropdownPosition {
  const floatingPosition = useFloatingPlacement({
    isOpen,
    triggerRef,
    contentRef,
    spacing,
    preferredSide: "bottom",
    strategy: "prefer-bottom-then-top",
    align: "start",
    matchWidth: true,
    estimatedHeight,
    estimatedWidth,
  });

  if (!floatingPosition || !triggerRef.current) {
    return null;
  }

  // Convert floating placement to dropdown position format
  const triggerRect = triggerRef.current.getBoundingClientRect();
  const placement: IDropdownPlacement =
    floatingPosition.side === "top"
      ? floatingPosition.alignment === "end"
        ? "top-right"
        : "top"
      : floatingPosition.alignment === "end"
        ? "bottom-right"
        : "bottom";

  return {
    top: floatingPosition.top,
    left: floatingPosition.left,
    width: triggerRect.width,
    maxHeight:
      floatingPosition.maxHeight ??
      window.innerHeight - floatingPosition.top - 8,
    placement,
  };
}
