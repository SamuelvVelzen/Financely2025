import { useEffect, useRef, useState } from "react";
import type { Workbox } from "workbox-window";

/**
 * Registers the production service worker and surfaces when an update is waiting.
 */
export function usePwaServiceWorker() {
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const wbRef = useRef<Workbox | null>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (registeredRef.current) return;
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;

    registeredRef.current = true;
    let cancelled = false;

    void import("workbox-window")
      .then(({ Workbox }) => {
        if (cancelled) return;

        const wb = new Workbox("/sw.js");
        wbRef.current = wb;

        const onWaiting = () => {
          setIsDismissed(false);
          setIsUpdateReady(true);
        };

        wb.addEventListener("waiting", onWaiting);

        wb.addEventListener("controlling", () => {
          window.location.reload();
        });

        return wb.register();
      })
      .catch((error: unknown) => {
        console.warn("[pwa] Service worker registration failed", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      void wbRef.current?.update();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const applyUpdate = () => {
    wbRef.current?.messageSkipWaiting();
  };

  const dismissUpdate = () => {
    setIsDismissed(true);
  };

  return {
    isVisible: isUpdateReady && !isDismissed,
    applyUpdate,
    dismissUpdate,
  };
}
