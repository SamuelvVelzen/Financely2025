/**
 * Platform helpers for PWA install UX.
 * Pure functions accept overrides so unit tests can pass UA strings.
 */

export function isIosDevice(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
  options: {
    maxTouchPoints?: number;
    platform?: string;
  } = {}
): boolean {
  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return true;
  }

  // iPadOS 13+ reports as MacIntel with touch
  const maxTouchPoints =
    options.maxTouchPoints ??
    (typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0);
  const platform =
    options.platform ??
    (typeof navigator !== "undefined" ? navigator.platform : "");

  return platform === "MacIntel" && maxTouchPoints > 1;
}
