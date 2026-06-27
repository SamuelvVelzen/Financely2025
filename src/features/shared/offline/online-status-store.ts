import { requestOfflineSync } from "@/features/shared/offline/offline-sync-request";

/**
 * Shared browser online/offline state for hooks and non-React code (fetch gate, outbox processor).
 */
let isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
const listeners = new Set<() => void>();

function setOnline(next: boolean): void {
  const wasOffline = !isOnline;
  if (isOnline === next) return;
  isOnline = next;
  for (const listener of listeners) {
    listener();
  }
  if (next && wasOffline) {
    requestOfflineSync();
  }
}

/** Called when a mutation fails with a network error while navigator.onLine is true. */
export function reportNetworkFailure(): void {
  setOnline(false);
}

/** Called after a successful API request to recover from a prior network failure. */
export function reportNetworkSuccess(): void {
  if (typeof navigator !== "undefined" && navigator.onLine) {
    setOnline(true);
  }
}

function handleOnline(): void {
  setOnline(true);
}

function handleOffline(): void {
  setOnline(false);
}

let listenersAttached = false;

function ensureListeners(): void {
  if (typeof window === "undefined" || listenersAttached) return;
  listenersAttached = true;
  isOnline = navigator.onLine;
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
}

export function subscribeOnlineStatus(callback: () => void): () => void {
  ensureListeners();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getIsOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return isOnline;
}

export function getServerSnapshotIsOnline(): boolean {
  return true;
}
