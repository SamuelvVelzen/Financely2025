import { useEffect, useState } from "react";
import { isIosDevice } from "./pwa-install-platform";
import {
  dismissPwaInstallPrompt,
  isPwaInstallDismissed,
  isStandaloneDisplayMode,
  type IBeforeInstallPromptEvent,
} from "./pwa-install-storage";

const IOS_PROMPT_DELAY_MS = 1500;

export type IPwaInstallPromptVariant = "native" | "ios";

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<IBeforeInstallPromptEvent | null>(null);
  const [variant, setVariant] = useState<IPwaInstallPromptVariant | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneDisplayMode() || isPwaInstallDismissed()) return;

    // iOS has no beforeinstallprompt — coach Share → Add to Home Screen.
    if (isIosDevice()) {
      const timeoutId = window.setTimeout(() => {
        setVariant("ios");
      }, IOS_PROMPT_DELAY_MS);
      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as IBeforeInstallPromptEvent);
      setVariant("native");
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setVariant(null);
      dismissPwaInstallPrompt();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVariant(null);
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      dismissPwaInstallPrompt();
    }
  };

  const dismiss = () => {
    setDeferredPrompt(null);
    setVariant(null);
    dismissPwaInstallPrompt();
  };

  const isVisible =
    variant === "ios" || (variant === "native" && deferredPrompt != null);

  return {
    isVisible,
    variant,
    install,
    dismiss,
  };
}
