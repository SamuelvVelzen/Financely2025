import { useEffect, useRef, useState } from "react";
import { useResponsive } from "./useResponsive";

/**
 * Hook to detect when a target element scrolls out of view
 * Returns true when the element is not visible in the viewport
 */
export function useScrollPosition(): [
  boolean,
  (element: HTMLElement | null) => void,
] {
  const { isMobile } = useResponsive();
  const [isSticky, setIsSticky] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setElement = (element: HTMLElement | null) => {
    // Clean up previous observer
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current);
      observerRef.current.disconnect();
    }

    elementRef.current = element;

    if (!element) {
      setIsSticky(false);
      return;
    }

    // Create new IntersectionObserver
    // Use intersectionRatio for more stable detection to prevent flickering
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // When element is mostly out of view (less than 10% visible), show sticky header
        // Using intersectionRatio prevents rapid toggling at the boundary
        setIsSticky(entry.intersectionRatio < 0.1);
      },
      {
        threshold: [0, 0.1, 1], // Multiple thresholds for smoother transitions
        rootMargin: isMobile ? "-64px 0px 0px 0px" : "0px",
      }
    );

    observerRef.current.observe(element);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [isSticky, setElement];
}
