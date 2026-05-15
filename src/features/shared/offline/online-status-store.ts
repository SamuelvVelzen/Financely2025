/**
 * Shared browser online/offline state for hooks and non-React code (fetch gate, outbox processor).
 */
let isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
const listeners = new Set<() => void>();

function setOnline(next: boolean) {
  if (isOnline === next) return;
  isOnline = next;
  for (const l of listeners) l();
}

function handleOnline() {
  setOnline(true);
}

function handleOffline() {
  setOnline(false);
}

let listenersAttached = false;

function ensureListeners() {
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
