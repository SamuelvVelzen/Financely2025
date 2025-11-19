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
  width: number;
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
  spacing?: number;
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
 * - Allows overflow if none of the options fit
 *
 * @param options - Configuration options
 * @returns Calculated dropdown position or null
 */
export function useDropdownPlacement({
  isOpen,
  triggerRef,
  contentRef,
  placement,
  spacing = 4,
}: IUseDropdownPlacementOptions): IDropdownPosition {
  // Default to ["bottom", "top", "left", "right"] for dropdowns
  const placementOptions: IPlacementOption[] | IPlacementOption =
    placement !== undefined ? placement : ["bottom", "top", "left", "right"];

  const floatingPosition = useFloatingPlacement({
    isOpen,
    triggerRef,
    contentRef,
    placement: placementOptions,
    spacing,
    matchWidth: true,
  });

  if (!floatingPosition || !triggerRef.current) {
    return null;
  }

  // Convert floating placement to dropdown position format
  const triggerRect = triggerRef.current.getBoundingClientRect();
  const dropdownPlacement: IDropdownPlacement =
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
    placement: dropdownPlacement,
  };
}
