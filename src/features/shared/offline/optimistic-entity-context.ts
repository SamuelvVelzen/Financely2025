/**
 * While a create mutation runs, holds the optimistic client id shown in the UI
 * so the offline outbox can link server ids after sync.
 */
let pendingClientEntityId: string | null = null;

export function setPendingClientEntityId(id: string | null): void {
  pendingClientEntityId = id;
}

export function takePendingClientEntityId(): string | null {
  const id = pendingClientEntityId;
  pendingClientEntityId = null;
  return id;
}
