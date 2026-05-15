import { ApiClientError, replayOfflineMutationFromRecord } from "@/features/shared/api/client";
import {
  getOfflineOutboxUserId,
  listOfflineMutationsForUser,
  removeOfflineMutation,
  subscribeOfflineOutboxUserId,
} from "@/features/shared/offline/offline-mutation-outbox";
import { getIsOnline, subscribeOnlineStatus } from "@/features/shared/offline/online-status-store";
import { useToast } from "@/features/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

function parseInvalidateBases(json: string): unknown[][] {
  try {
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is unknown[] => Array.isArray(x));
  } catch {
    return [];
  }
}

/**
 * Replays queued JSON mutations when the browser is online.
 */
export function OfflineMutationProcessor() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const draining = useRef(false);

  const userId = useSyncExternalStore(
    subscribeOfflineOutboxUserId,
    getOfflineOutboxUserId,
    () => null,
  );

  const runDrain = useCallback(async () => {
    if (!getIsOnline()) return;
    if (draining.current) return;
    draining.current = true;
    try {
      const uid = getOfflineOutboxUserId();
      if (!uid) return;

      while (getIsOnline()) {
        const rows = await listOfflineMutationsForUser(uid);
        if (rows.length === 0) break;
        const next = rows[0];
        try {
          await replayOfflineMutationFromRecord(next);
          const bases = parseInvalidateBases(next.invalidateBasesJson);
          for (const base of bases) {
            queryClient.invalidateQueries({ queryKey: base });
          }
          await removeOfflineMutation(next.id);
        } catch (e: unknown) {
          if (e instanceof ApiClientError && e.statusCode === 401) {
            toast.warning(
              "Session expired",
              "Sign in again to sync changes that were saved on this device while you were offline.",
              { position: "top-center", duration: 0 },
            );
            break;
          }
          break;
        }
      }
    } finally {
      draining.current = false;
    }
  }, [queryClient, toast]);

  useEffect(() => {
    void runDrain();
  }, [runDrain, userId]);

  useEffect(() => {
    return subscribeOnlineStatus(() => {
      if (getIsOnline()) {
        void runDrain();
      }
    });
  }, [runDrain]);

  return null;
}
