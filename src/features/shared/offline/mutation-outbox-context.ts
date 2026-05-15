/**
 * While a useFinMutation mutationFn runs, stores serializable invalidation bases
 * so the offline outbox can replay invalidations after sync.
 */
let pendingInvalidateBases: readonly (readonly unknown[])[] = [];

export function setPendingOutboxInvalidations(
  bases: readonly (readonly unknown[])[],
): void {
  pendingInvalidateBases = bases;
}

export function getPendingOutboxInvalidations(): readonly (readonly unknown[])[] {
  return pendingInvalidateBases;
}

export function clearPendingOutboxInvalidations(): void {
  pendingInvalidateBases = [];
}
