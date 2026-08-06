import { ApiClientError } from "@/features/shared/api/client";

/**
 * True when a fetch failed before receiving an HTTP response (offline, DNS, timeout, etc.).
 */
export function isReplayableNetworkError(error: unknown): boolean {
  if (error instanceof ApiClientError) return false;
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === "AbortError") {
    // Playwright route.abort("internetdisconnected") surfaces as AbortError in some browsers
    const msg = error.message.toLowerCase();
    return (
      msg.includes("internet") ||
      msg.includes("network") ||
      msg.includes("failed")
    );
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("networkerror") ||
      msg.includes("load failed") ||
      msg.includes("network request failed") ||
      msg.includes("internetdisconnected") ||
      msg.includes("net::err_")
    );
  }
  return false;
}
