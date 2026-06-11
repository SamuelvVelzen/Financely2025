import type { IButtonProps } from "../../button/button";
import type { KeyboardEvent, RefObject } from "react";
import { useCallback, useEffect } from "react";

const PRIMARY_ACTION_VARIANTS = new Set([
  "primary",
  "danger",
  "success",
  "warning",
  "info",
]);

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusableElements(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
  ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
}

function focusElementWithIndicator(element: HTMLElement): void {
  try {
    // focusVisible is in the FocusOptions spec but not yet in all TS libs
    element.focus({ focusVisible: true } as FocusOptions);
  } catch {
    element.focus();
  }
}

export function getPrimaryFooterButtonIndex(
  footerButtons: IButtonProps[] | undefined
): number {
  if (!footerButtons?.length) return -1;

  let lastPrimaryIndex = -1;
  footerButtons.forEach((btn, index) => {
    const variant = btn.variant ?? "default";
    if (PRIMARY_ACTION_VARIANTS.has(variant) && !btn.disabled) {
      lastPrimaryIndex = index;
    }
  });

  if (lastPrimaryIndex >= 0) return lastPrimaryIndex;

  for (let i = footerButtons.length - 1; i >= 0; i--) {
    if (!footerButtons[i].disabled) return i;
  }

  return footerButtons.length - 1;
}

interface IUseFocusTrapOptions {
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  disableInitialFocus?: boolean;
  onEscape?: () => void;
}

/**
 * Hook for managing focus trap and keyboard navigation
 * Extracted from Dialog component for reuse
 */
export function useFocusTrap({
  enabled,
  containerRef,
  initialFocusRef,
  disableInitialFocus = false,
  onEscape,
}: IUseFocusTrapOptions) {
  const getContainerFocusableElements = useCallback(() => {
    if (!containerRef.current || typeof window === "undefined") return [];
    return getFocusableElements(containerRef.current);
  }, [containerRef]);

  // Focus trap: handle Tab and Shift+Tab
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const focusableElements = getContainerFocusableElements();
      if (focusableElements.length === 0) {
        // No focusable elements, prevent tabbing out
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Check if focus is within container
      const isFocusInContainer =
        containerRef.current?.contains(activeElement) ||
        activeElement === containerRef.current;

      if (!isFocusInContainer) {
        // Focus escaped, bring it back
        e.preventDefault();
        firstElement.focus();
        return;
      }

      if (e.shiftKey) {
        // Shift+Tab
        if (
          activeElement === firstElement ||
          activeElement === containerRef.current
        ) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (
          activeElement === lastElement ||
          activeElement === containerRef.current
        ) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [onEscape, getContainerFocusableElements, containerRef]
  );

  // Set initial focus when container opens via an explicit ref
  useEffect(() => {
    if (
      !enabled ||
      disableInitialFocus ||
      !initialFocusRef ||
      typeof window === "undefined"
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const target = initialFocusRef.current;
      if (target) {
        focusElementWithIndicator(target);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [enabled, disableInitialFocus, initialFocusRef]);

  return { handleKeyDown };
}
