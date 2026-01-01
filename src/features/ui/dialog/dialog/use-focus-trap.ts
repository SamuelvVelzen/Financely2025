"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect } from "react";

interface IUseFocusTrapOptions {
  enabled: boolean;
  containerRef: React.RefObject<HTMLElement>;
  onEscape?: () => void;
}

/**
 * Hook for managing focus trap and keyboard navigation
 * Extracted from Dialog component for reuse
 */
export function useFocusTrap({
  enabled,
  containerRef,
  onEscape,
}: IUseFocusTrapOptions) {
  // Get all focusable elements within container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current || typeof window === "undefined") return [];

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }, [containerRef]);

  // Focus trap: handle Tab and Shift+Tab
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
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
    [onEscape, getFocusableElements, containerRef]
  );

  // Focus first element when container opens
  useEffect(() => {
    if (!enabled || !containerRef.current || typeof window === "undefined")
      return;

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      // Focus container if no focusable elements
      containerRef.current.focus();
      return;
    }

    // Filter out buttons in the header (close button)
    const header = containerRef.current.querySelector("header");
    const elementsOutsideHeader = focusableElements.filter((el) => {
      return !header?.contains(el);
    });

    // Focus first element outside header, or first element if none found
    const elementToFocus =
      elementsOutsideHeader.length > 0
        ? elementsOutsideHeader[0]
        : focusableElements[0];

    // Small delay to ensure container is visible
    setTimeout(() => {
      elementToFocus.focus();
    }, 100);
  }, [enabled, getFocusableElements, containerRef]);

  return { handleKeyDown };
}
