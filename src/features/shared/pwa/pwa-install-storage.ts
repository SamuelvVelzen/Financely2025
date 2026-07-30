const INSTALL_DISMISSED_KEY = "pwaInstallDismissed:v1";

export type IBeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isPwaInstallDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissPwaInstallPrompt(): void {
  try {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const mediaStandalone = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mediaStandalone || iosStandalone;
}
