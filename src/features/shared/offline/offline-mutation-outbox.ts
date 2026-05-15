import { getPendingOutboxInvalidations } from "./mutation-outbox-context";

const DB_NAME = "financely-offline-mutations";
const DB_VERSION = 1;
const STORE = "mutations";

export interface IOfflineMutationRecord {
  readonly id: string;
  readonly userId: string;
  readonly method: "POST" | "PATCH" | "PUT" | "DELETE";
  /** Path after /api/v1 (e.g. `/budgets` or `/budgets/abc`) */
  readonly endpoint: string;
  readonly body: unknown | undefined;
  /** JSON-serialized array of query key prefixes */
  readonly invalidateBasesJson: string;
  readonly createdAt: number;
}

let currentUserId: string | null = null;
const userIdListeners = new Set<() => void>();

function notifyOutboxUserIdChanged(): void {
  for (const l of userIdListeners) {
    l();
  }
}

export function subscribeOfflineOutboxUserId(callback: () => void): () => void {
  userIdListeners.add(callback);
  return () => {
    userIdListeners.delete(callback);
  };
}

export function setOfflineOutboxUserId(userId: string | null): void {
  if (currentUserId === userId) return;
  currentUserId = userId;
  notifyOutboxUserIdChanged();
}

export function getOfflineOutboxUserId(): string | null {
  return currentUserId;
}

export function openOfflineMutationDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("byUserCreated", ["userId", "createdAt"]);
      }
    };
  });
}

export async function enqueueOfflineMutation(input: {
  userId: string;
  method: IOfflineMutationRecord["method"];
  endpoint: string;
  body: unknown | undefined;
}): Promise<string> {
  const id = crypto.randomUUID();
  const invalidateBases = getPendingOutboxInvalidations().map((row) => [...row]);
  const record: IOfflineMutationRecord = {
    id,
    userId: input.userId,
    method: input.method,
    endpoint: input.endpoint,
    body: input.body,
    invalidateBasesJson: JSON.stringify(invalidateBases),
    createdAt: Date.now(),
  };

  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error ?? new Error("enqueue failed"));
    tx.objectStore(STORE).add(record);
  });
}

export async function listOfflineMutationsForUser(
  userId: string,
): Promise<IOfflineMutationRecord[]> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const idx = store.index("byUserCreated");
    const range = IDBKeyRange.bound(
      [userId, 0],
      [userId, Number.MAX_SAFE_INTEGER],
    );
    const req = idx.getAll(range);
    req.onsuccess = () => {
      const rows = (req.result as IOfflineMutationRecord[]) ?? [];
      rows.sort((a, b) => a.createdAt - b.createdAt);
      resolve(rows);
    };
    req.onerror = () => reject(req.error ?? new Error("listOfflineMutations failed"));
  });
}

export async function removeOfflineMutation(id: string): Promise<void> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("remove failed"));
    tx.objectStore(STORE).delete(id);
  });
}

export async function clearOfflineMutationsForUser(userId: string): Promise<void> {
  const rows = await listOfflineMutationsForUser(userId);
  if (rows.length === 0) return;
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("clear user failed"));
    const store = tx.objectStore(STORE);
    for (const r of rows) {
      store.delete(r.id);
    }
  });
}

export async function clearAllOfflineMutations(): Promise<void> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("clearAll failed"));
    tx.objectStore(STORE).clear();
  });
}
