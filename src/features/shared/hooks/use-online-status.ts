import { useSyncExternalStore } from "react";
import {
  getIsOnline,
  getServerSnapshotIsOnline,
  subscribeOnlineStatus,
} from "../offline/online-status-store";

/**
 * Hook to track online/offline status (same source as the offline mutation fetch gate).
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnlineStatus,
    getIsOnline,
    getServerSnapshotIsOnline,
  );
}
