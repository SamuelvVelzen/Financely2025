import { useCallback } from "react";

/**
 * Hook to scroll to a specific element by ID
 * @param elementId - The ID of the element to scroll to
 * @returns A function to trigger the scroll
 */
export function useScrollToElement(elementId: string) {
  const scrollToElement = useCallback(() => {
    const element = document.getElementById(elementId);
    if (element) {
      // Scroll first with smooth behavior
      element.scrollIntoView({ behavior: "smooth", block: "start" });

      // Then update the URL hash without triggering browser scroll
      // Use history.pushState to update hash without scrolling
      const url = new URL(window.location.href);
      url.hash = elementId;
      window.history.pushState(null, "", url.toString());
    }
  }, [elementId]);

  return scrollToElement;
}
