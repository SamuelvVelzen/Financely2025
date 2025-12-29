import { useEffect, useRef, useState } from "react";

interface IUseIntersectionObserverOptions {
  /**
   * The root element for intersection checking. Defaults to viewport.
   */
  root?: Element | null;
  /**
   * Margin around the root. Can have values similar to the CSS margin property.
   */
  rootMargin?: string;
  /**
   * Threshold at which to trigger callback. 0.0 means as soon as any part is visible.
   */
  threshold?: number | number[];
  /**
   * Whether the observer is enabled
   */
  enabled?: boolean;
}

/**
 * Hook for observing when an element enters the viewport
 * Useful for infinite scroll implementations
 *
 * @param callback - Function to call when element becomes visible
 * @param options - Intersection Observer options
 * @returns Ref callback to attach to the element to observe
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IUseIntersectionObserverOptions = {}
): (node: Element | null) => void {
  const { root = null, rootMargin = "0px", threshold = 0, enabled = true } =
    options;
  const [element, setElement] = useState<Element | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callbackRef.current();
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, root, rootMargin, threshold, enabled]);

  // Return ref callback
  return setElement;
}

