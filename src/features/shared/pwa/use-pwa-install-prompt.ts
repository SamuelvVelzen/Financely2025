import { useEffect, useState } from "react";
import {
  dismissPwaInstallPrompt,
  isPwaInstallDismissed,
  isStandaloneDisplayMode,
  type IBeforeInstallPromptEvent,
} from "./pwa-install-storage";

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<IBeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneDisplayMode() || isPwaInstallDismissed()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as IBeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
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
    setIsVisible(false);
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      dismissPwaInstallPrompt();
    }
  };

  const dismiss = () => {
    setIsVisible(false);
    dismissPwaInstallPrompt();
  };

  return {
    isVisible: isVisible && deferredPrompt != null,
    install,
    dismiss,
  };
}
