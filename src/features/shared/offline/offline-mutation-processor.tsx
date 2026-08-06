import { ApiClientError, replayOfflineMutationFromRecord } from "@/features/shared/api/client";
import {
  getOfflineOutboxUserId,
  listOfflineMutationsForUser,
  removeOfflineMutation,
  subscribeOfflineOutboxUserId,
  unblockAllMutationsForUser,
} from "@/features/shared/offline/offline-mutation-outbox";
import { OFFLINE_SYNC_REQUEST_EVENT } from "@/features/shared/offline/offline-sync-request";
import {
  applyRemapsToRecord,
  markMutationSyncFailure,
  recordCreateIdRemap,
} from "@/features/shared/offline/offline-sync-helpers";
import { getIsOnline } from "@/features/shared/offline/online-status-store";
import { useToast } from "@/features/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const MAX_MANUAL_REPLAY_ATTEMPTS = 3;

function parseInvalidateBases(json: string): unknown[][] {
  try {
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is unknown[] => Array.isArray(x));
  } catch {
    return [];
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Sync failed";
}

/**
 * Replays queued mutations when online. Auto-sync runs once per reconnect;
 * further attempts are manual via the pending-sync indicator.
 */
export function OfflineMutationProcessor() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const draining = useRef(false);
  const lastBlockedToastId = useRef<string | null>(null);

  const userId = useSyncExternalStore(
    subscribeOfflineOutboxUserId,
    getOfflineOutboxUserId,
    () => null,
  );

  const runDrain = useCallback(
    async (options: { manual: boolean }) => {
      if (!getIsOnline()) return;
      if (draining.current) return;
      draining.current = true;

      try {
        const uid = getOfflineOutboxUserId();
        if (!uid) return;

        if (options.manual) {
          await unblockAllMutationsForUser(uid);
        }

        let syncedCount = 0;

        while (getIsOnline()) {
          const rows = await listOfflineMutationsForUser(uid);
          if (rows.length === 0) break;

          const next = rows[0];
          if (!options.manual && next.syncBlocked) {
            if (lastBlockedToastId.current !== next.id) {
              lastBlockedToastId.current = next.id;
              toast.warning(
                "Sync needs attention",
                next.lastSyncError ??
                  "A saved change could not sync automatically. Tap the pending sync badge to retry.",
                { position: "top-center" },
              );
            }
            return;
          }

          const maxAttempts = options.manual ? MAX_MANUAL_REPLAY_ATTEMPTS : 3;
          let replayed = false;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const prepared = await applyRemapsToRecord(next);
              const result = await replayOfflineMutationFromRecord(prepared);
              await recordCreateIdRemap(prepared, result);

              const bases = parseInvalidateBases(prepared.invalidateBasesJson);
              for (const base of bases) {
                queryClient.invalidateQueries({ queryKey: base });
              }
              await removeOfflineMutation(prepared.id);
              syncedCount += 1;
              replayed = true;
              lastBlockedToastId.current = null;
              break;
            } catch (e: unknown) {
              if (e instanceof ApiClientError && e.statusCode === 401) {
                toast.warning(
                  "Session expired",
                  "Sign in again to sync changes that were saved on this device while you were offline.",
                  { position: "top-center", duration: 0 },
                );
                return;
              }

              const canRetry = options.manual && attempt < maxAttempts;
              if (!canRetry) {
                await markMutationSyncFailure(next, errorMessage(e), options);
                if (options.manual) {
                  toast.warning(
                    "Sync failed",
                    `${errorMessage(e)} Use the edit icon next to the pending sync badge to review or remove changes.`,
                    { position: "top-center" },
                  );
                } else {
                  toast.warning(
                    "Sync paused",
                    "Tap the pending sync badge to retry your saved changes.",
                    { position: "top-center" },
                  );
                }
                return;
              }
            }
          }

          if (!replayed) return;
        }

        if (syncedCount > 0) {
          toast.show({
            title: "Changes synced",
            message:
              syncedCount === 1
                ? "1 saved change was sent to the server."
                : `${syncedCount} saved changes were sent to the server.`,
            variant: "success",
            position: "top-center",
          });
        }
      } finally {
        draining.current = false;
      }
    },
    [queryClient, toast],
  );

  useEffect(() => {
    if (!userId || !getIsOnline()) return;
    void runDrain({ manual: false });
  }, [userId, runDrain]);

  useEffect(() => {
    const handleManual = () => {
      void runDrain({ manual: true });
    };
    window.addEventListener(OFFLINE_SYNC_REQUEST_EVENT, handleManual);
    return () =>
      window.removeEventListener(OFFLINE_SYNC_REQUEST_EVENT, handleManual);
  }, [runDrain]);

  return null;
}
