import {
  clearOfflineMutationsForUser,
  getOfflineOutboxUserId,
} from "@/features/shared/offline/offline-mutation-outbox";

/**
 * Clears the current user's offline mutation queue before signing out
 * so the next account on this device does not inherit pending writes.
 */
export async function clearOfflineOutboxBeforeSignOut(): Promise<void> {
  const userId = getOfflineOutboxUserId();
  if (userId) {
    await clearOfflineMutationsForUser(userId);
  }
}
