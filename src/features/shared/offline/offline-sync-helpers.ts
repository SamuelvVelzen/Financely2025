import { applyIdRemapsToValue } from "@/features/shared/offline/offline-id-remap-utils";
import {
  getAllIdRemaps,
  rewriteQueuedMutationBodies,
  setIdRemap,
  updateOfflineMutationRecord,
  type IOfflineMutationRecord,
} from "@/features/shared/offline/offline-mutation-outbox";

export async function applyRemapsToRecord(
  record: IOfflineMutationRecord,
): Promise<IOfflineMutationRecord> {
  const remaps = await getAllIdRemaps();
  if (remaps.size === 0 || record.contentType === "multipart") {
    return record;
  }
  return {
    ...record,
    body:
      record.body !== undefined
        ? applyIdRemapsToValue(record.body, remaps)
        : record.body,
  };
}

export async function recordCreateIdRemap(
  record: IOfflineMutationRecord,
  result: unknown,
): Promise<void> {
  if (!record.clientEntityId) return;
  if (!result || typeof result !== "object" || !("id" in result)) return;
  const serverId = (result as { id: unknown }).id;
  if (typeof serverId !== "string") return;

  await setIdRemap(record.clientEntityId, serverId);
  const remaps = await getAllIdRemaps();
  await rewriteQueuedMutationBodies(record.userId, remaps, (value) =>
    applyIdRemapsToValue(value, remaps),
  );
}

export async function markMutationSyncFailure(
  record: IOfflineMutationRecord,
  errorMessage: string,
  options: { manual: boolean },
): Promise<IOfflineMutationRecord> {
  const autoSyncAttempts =
    (record.autoSyncAttempts ?? 0) + (options.manual ? 0 : 1);
  const updated: IOfflineMutationRecord = {
    ...record,
    autoSyncAttempts,
    lastSyncError: errorMessage,
    syncBlocked: options.manual ? true : autoSyncAttempts >= 1,
  };
  await updateOfflineMutationRecord(updated);
  return updated;
}
