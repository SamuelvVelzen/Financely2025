export const OFFLINE_SYNC_REQUEST_EVENT = "financely-request-offline-sync";

export function requestOfflineSync(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_REQUEST_EVENT));
}
