import {
  useFloatingPlacement,
  type IPlacementOption,
} from "./use-floating-placement";

export type IDropdownPlacement =
  | "bottom"
  | "top"
  | "bottom-right"
  | "top-right";

export type IDropdownPosition = {
  top: number;
  left: number;
  width?: number; // Optional - matches trigger width when opened, then stays stable
  maxHeight: number;
  placement: IDropdownPlacement;
} | null;

// Re-export for convenience
export type { IPlacementOption };

type IUseDropdownPlacementOptions = {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
  placement?: IPlacementOption[] | IPlacementOption;
};

/**
 * Hook for calculating smart dropdown placement
 *
 * This is a convenience wrapper around useFloatingPlacement with dropdown-specific defaults.
 *
 * Features:
 * - Tries placement options in order until one fits on screen
 * - Uses actual element dimensions for accurate calculations
 * - Updates position on scroll and resize
 * - Menu must always stay fully inside viewport with 8px margin
 * - Zero gap between trigger and menu
 *
 * @param options - Configuration options
 * @returns Calculated dropdown position or null
 */
export function useDropdownPlacement({
  isOpen,
  triggerRef,
  contentRef,
  placement,
}: IUseDropdownPlacementOptions): IDropdownPosition {
  // Default to "auto" for dropdowns (tries bottom, top, left, right in order)
  const placementOptions: IPlacementOption[] | IPlacementOption =
    placement !== undefined ? placement : "auto";

  // Use enhanced matchWidth which locks width on open
  const floatingPosition = useFloatingPlacement({
    isOpen,
    triggerRef,
    contentRef,
    placement: placementOptions,
    matchWidth: true, // Enhanced matchWidth locks width on open
  });

  if (!floatingPosition || !triggerRef.current) {
    return null;
  }

  // Convert floating placement to dropdown position format
  const dropdownPlacement: IDropdownPlacement =
    floatingPosition.side === "top"
      ? floatingPosition.alignment === "end"
        ? "top-right"
        : "top"
      : floatingPosition.alignment === "end"
        ? "bottom-right"
        : "bottom";

  // Extract width from floating position (set by enhanced matchWidth)
  return {
    top: floatingPosition.top,
    left: floatingPosition.left,
    width: floatingPosition.width,
    maxHeight:
      floatingPosition.maxHeight ??
      window.innerHeight - floatingPosition.top - 8,
    placement: dropdownPlacement,
  };
}
