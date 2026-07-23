import {
  listOfflineMutationsForCurrentUser,
  subscribeOfflineOutboxChanged,
  subscribeOfflineOutboxUserId,
  type IOfflineMutationRecord,
} from "@/features/shared/offline/offline-mutation-outbox";
import { useSyncExternalStore } from "react";

let pendingRows: IOfflineMutationRecord[] = [];
const rowsListeners = new Set<() => void>();
let refreshPromise: Promise<void> | null = null;

async function refreshPendingRows(): Promise<void> {
  pendingRows = await listOfflineMutationsForCurrentUser();
  for (const listener of rowsListeners) {
    listener();
  }
}

function scheduleRefresh(): void {
  if (refreshPromise) return;
  refreshPromise = refreshPendingRows().finally(() => {
    refreshPromise = null;
  });
}

function subscribePendingRows(callback: () => void): () => void {
  rowsListeners.add(callback);
  scheduleRefresh();
  const unsubOutbox = subscribeOfflineOutboxChanged(() => scheduleRefresh());
  const unsubUser = subscribeOfflineOutboxUserId(() => scheduleRefresh());
  return () => {
    rowsListeners.delete(callback);
    unsubOutbox();
    unsubUser();
  };
}

function getPendingRowsSnapshot(): IOfflineMutationRecord[] {
  return pendingRows;
}

const EMPTY_PENDING_ROWS: IOfflineMutationRecord[] = [];

export function usePendingOfflineMutations(): {
  mutations: IOfflineMutationRecord[];
  pendingCount: number;
  hasSyncIssues: boolean;
} {
  const mutations = useSyncExternalStore(
    subscribePendingRows,
    getPendingRowsSnapshot,
    () => EMPTY_PENDING_ROWS,
  );

  return {
    mutations,
    pendingCount: mutations.length,
    hasSyncIssues: mutations.some(
      (row) => row.syncBlocked || Boolean(row.lastSyncError),
    ),
  };
}
