import { useToast } from "@/features/ui/toast";
import { useEffect, useRef } from "react";

/**
 * Registers the production service worker and prompts when an update is ready.
 * Returns null (side effects only).
 *
 * workbox-window is loaded dynamically so Vite SSR never evaluates its CJS build.
 */
export function PwaRegister() {
  const toast = useToast();
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

        wb.addEventListener("waiting", () => {
          toast.show({
            title: "Update available",
            message: "Tap to reload and get the latest version of Financely.",
            variant: "info",
            position: "top-center",
            duration: 0,
            onClick: () => {
              wb.messageSkipWaiting();
            },
          });
        });

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
  }, [toast]);

  return null;
}
