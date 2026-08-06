import {
  applyIdRemapsToEndpoint,
  applyIdRemapsToValue,
} from "@/features/shared/offline/offline-id-remap-utils";
import {
  getAllIdRemaps,
  rewriteQueuedMutations,
  setIdRemap,
  updateOfflineMutationRecord,
  type IOfflineMutationRecord,
} from "@/features/shared/offline/offline-mutation-outbox";

export async function applyRemapsToRecord(
  record: IOfflineMutationRecord,
): Promise<IOfflineMutationRecord> {
  const remaps = await getAllIdRemaps();
  if (remaps.size === 0) {
    return record;
  }
  const endpoint = applyIdRemapsToEndpoint(record.endpoint, remaps);
  if (record.contentType === "multipart") {
    return endpoint === record.endpoint ? record : { ...record, endpoint };
  }
  return {
    ...record,
    endpoint,
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
  const rawId = (result as { id: unknown }).id;
  const serverId =
    typeof rawId === "string"
      ? rawId
      : typeof rawId === "number" && Number.isFinite(rawId)
        ? String(rawId)
        : null;
  if (!serverId) return;

  await setIdRemap(record.clientEntityId, serverId);

  // Offline split-group create seeds `optimistic-member-${tempId}`; map that to
  // the real creator membership so queued expenses can sync.
  const currentMemberId = (result as { currentMemberId?: unknown })
    .currentMemberId;
  if (typeof currentMemberId === "string" && currentMemberId.length > 0) {
    await setIdRemap(
      `optimistic-member-${record.clientEntityId}`,
      currentMemberId,
    );
  }

  const remaps = await getAllIdRemaps();
  await rewriteQueuedMutations(record.userId, remaps);
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
    syncBlocked: options.manual ? true : autoSyncAttempts >= 3,
  };
  await updateOfflineMutationRecord(updated);
  return updated;
}
