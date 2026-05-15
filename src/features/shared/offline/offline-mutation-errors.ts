export class OfflineMutationQueuedError extends Error {
  readonly isOfflineQueued = true as const;

  constructor(public readonly queueId: string) {
    super("offline_queued");
    this.name = "OfflineMutationQueuedError";
  }
}

export function isOfflineMutationQueuedError(
  e: unknown,
): e is OfflineMutationQueuedError {
  return e instanceof OfflineMutationQueuedError;
}

/** Sentinel returned from useFinMutation when a write was queued locally */
export const OFFLINE_MUTATION_PLACEHOLDER = Object.freeze({
  _financelyOfflineMutationQueued: true as const,
});

export type IOfflineMutationPlaceholder = typeof OFFLINE_MUTATION_PLACEHOLDER;

export function isOfflineMutationPlaceholder(
  data: unknown,
): data is IOfflineMutationPlaceholder {
  return (
    typeof data === "object" &&
    data !== null &&
    "_financelyOfflineMutationQueued" in data &&
    (data as { _financelyOfflineMutationQueued?: unknown })
      ._financelyOfflineMutationQueued === true
  );
}

export const OFFLINE_MUTATION_QUEUED_EVENT = "financely-offline-mutation-queued";

/** Default second line when a mutation is queued for sync (title comes from the hook or a generic default). */
export const OFFLINE_MUTATION_DEFAULT_DETAIL =
  "Stored on this device. It will sync automatically when you are back online.";

export interface IOfflineMutationQueuedDetail {
  queueId: string;
  /** e.g. "Expense created successfully" — combined with offline detail in one toast */
  successTitle?: string;
  successMessage?: string;
}

export function dispatchOfflineMutationQueued(
  detail: IOfflineMutationQueuedDetail,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OFFLINE_MUTATION_QUEUED_EVENT, { detail }),
  );
}
