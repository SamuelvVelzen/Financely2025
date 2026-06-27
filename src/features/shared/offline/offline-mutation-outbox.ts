import { bodyReferencesEntityId } from "./offline-mutation-body-utils";
import { takePendingClientEntityId } from "./optimistic-entity-context";
import { getPendingOutboxInvalidations } from "./mutation-outbox-context";

const DB_NAME = "financely-offline-mutations";
const OFFLINE_DB_VERSION = 3;
const STORE = "mutations";
const BLOB_STORE = "blobs";
const ID_REMAP_STORE = "id-remaps";

export type IOfflineFormDataField =
  | { name: string; kind: "string"; value: string }
  | {
      name: string;
      kind: "file";
      blobId: string;
      fileName: string;
      mimeType: string;
    };

export interface IOfflineMutationRecord {
  readonly id: string;
  readonly userId: string;
  readonly method: "POST" | "PATCH" | "PUT" | "DELETE";
  readonly endpoint: string;
  readonly contentType?: "json" | "multipart";
  readonly body: unknown | undefined;
  readonly formFieldsJson?: string;
  readonly invalidateBasesJson: string;
  readonly createdAt: number;
  /** Optimistic client id (e.g. temp tag id) linked to this create mutation */
  readonly clientEntityId?: string;
  readonly syncBlocked?: boolean;
  readonly autoSyncAttempts?: number;
  readonly lastSyncError?: string;
}

let currentUserId: string | null = null;
const userIdListeners = new Set<() => void>();
const outboxListeners = new Set<() => void>();

function notifyOutboxUserIdChanged(): void {
  for (const l of userIdListeners) l();
}

function notifyOutboxChanged(): void {
  for (const l of outboxListeners) l();
}

export function subscribeOfflineOutboxUserId(callback: () => void): () => void {
  userIdListeners.add(callback);
  return () => userIdListeners.delete(callback);
}

export function subscribeOfflineOutboxChanged(callback: () => void): () => void {
  outboxListeners.add(callback);
  return () => outboxListeners.delete(callback);
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
    const req = indexedDB.open(DB_NAME, OFFLINE_DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("byUserCreated", ["userId", "createdAt"]);
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ID_REMAP_STORE)) {
        db.createObjectStore(ID_REMAP_STORE, { keyPath: "clientId" });
      }
    };
  });
}

function mutationDedupeKey(
  method: string,
  endpoint: string,
  body: unknown | undefined,
): string {
  return `${method}:${endpoint}:${JSON.stringify(body ?? null)}`;
}

async function storeBlob(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readwrite");
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error ?? new Error("storeBlob failed"));
    tx.objectStore(BLOB_STORE).put({ id, blob });
  });
}

export async function getStoredBlob(blobId: string): Promise<Blob | null> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readonly");
    const req = tx.objectStore(BLOB_STORE).get(blobId);
    req.onsuccess = () => {
      const row = req.result as { blob?: Blob } | undefined;
      resolve(row?.blob ?? null);
    };
    req.onerror = () => reject(req.error ?? new Error("getStoredBlob failed"));
  });
}

async function deleteStoredBlob(blobId: string): Promise<void> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("deleteStoredBlob failed"));
    tx.objectStore(BLOB_STORE).delete(blobId);
  });
}

export async function serializeFormData(
  formData: FormData,
): Promise<IOfflineFormDataField[]> {
  const fields: IOfflineFormDataField[] = [];
  for (const [name, value] of formData.entries()) {
    if (typeof value === "string") {
      fields.push({ name, kind: "string", value });
      continue;
    }
    const blobId = await storeBlob(value);
    fields.push({
      name,
      kind: "file",
      blobId,
      fileName: value.name,
      mimeType: value.type || "application/octet-stream",
    });
  }
  return fields;
}

export async function deserializeFormData(
  fields: IOfflineFormDataField[],
): Promise<FormData> {
  const formData = new FormData();
  for (const field of fields) {
    if (field.kind === "string") {
      formData.append(field.name, field.value);
      continue;
    }
    const blob = await getStoredBlob(field.blobId);
    if (!blob) {
      throw new Error(`Missing offline blob ${field.blobId}`);
    }
    formData.append(field.name, blob, field.fileName);
  }
  return formData;
}

function parseFormFields(json: string | undefined): IOfflineFormDataField[] {
  if (!json) return [];
  try {
    const raw = JSON.parse(json) as unknown;
    return Array.isArray(raw) ? (raw as IOfflineFormDataField[]) : [];
  } catch {
    return [];
  }
}

async function deleteFormFieldBlobs(fields: IOfflineFormDataField[]): Promise<void> {
  for (const field of fields) {
    if (field.kind === "file") {
      await deleteStoredBlob(field.blobId);
    }
  }
}

export async function setIdRemap(
  clientId: string,
  serverId: string,
): Promise<void> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ID_REMAP_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("setIdRemap failed"));
    tx.objectStore(ID_REMAP_STORE).put({ clientId, serverId });
  });
}

export async function removeIdRemap(clientId: string): Promise<void> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ID_REMAP_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("removeIdRemap failed"));
    tx.objectStore(ID_REMAP_STORE).delete(clientId);
  });
}

export async function getAllIdRemaps(): Promise<Map<string, string>> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ID_REMAP_STORE, "readonly");
    const req = tx.objectStore(ID_REMAP_STORE).getAll();
    req.onsuccess = () => {
      const rows =
        (req.result as Array<{ clientId: string; serverId: string }>) ?? [];
      resolve(new Map(rows.map((r) => [r.clientId, r.serverId])));
    };
    req.onerror = () => reject(req.error ?? new Error("getAllIdRemaps failed"));
  });
}

export async function clearIdRemaps(): Promise<void> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ID_REMAP_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("clearIdRemaps failed"));
    tx.objectStore(ID_REMAP_STORE).clear();
  });
}

export async function updateOfflineMutationRecord(
  record: IOfflineMutationRecord,
): Promise<void> {
  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => {
      notifyOutboxChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("update record failed"));
    tx.objectStore(STORE).put(record);
  });
}

export async function rewriteQueuedMutationBodies(
  userId: string,
  remaps: ReadonlyMap<string, string>,
  applyRemaps: (value: unknown) => unknown,
): Promise<void> {
  const rows = await listOfflineMutationsForUser(userId);
  for (const row of rows) {
    if (row.contentType === "multipart" || row.body === undefined) continue;
    const nextBody = applyRemaps(row.body);
    if (JSON.stringify(nextBody) !== JSON.stringify(row.body)) {
      await updateOfflineMutationRecord({ ...row, body: nextBody });
    }
  }
}

export async function enqueueOfflineMutation(input: {
  userId: string;
  method: IOfflineMutationRecord["method"];
  endpoint: string;
  body?: unknown;
  formData?: FormData;
}): Promise<string> {
  const invalidateBases = getPendingOutboxInvalidations().map((row) => [...row]);
  const clientEntityId = takePendingClientEntityId() ?? undefined;

  let contentType: IOfflineMutationRecord["contentType"] = "json";
  let body: unknown | undefined = input.body;
  let formFieldsJson: string | undefined;

  if (input.formData) {
    contentType = "multipart";
    body = undefined;
    const fields = await serializeFormData(input.formData);
    formFieldsJson = JSON.stringify(fields);
  }

  const existing = await listOfflineMutationsForUser(input.userId);
  const dedupeKey = mutationDedupeKey(input.method, input.endpoint, body);
  const recentDuplicate = [...existing]
    .reverse()
    .find(
      (row) =>
        row.method === input.method &&
        row.endpoint === input.endpoint &&
        mutationDedupeKey(row.method, row.endpoint, row.body) === dedupeKey &&
        Date.now() - row.createdAt < 3000,
    );
  if (recentDuplicate) {
    return recentDuplicate.id;
  }

  const id = crypto.randomUUID();
  const record: IOfflineMutationRecord = {
    id,
    userId: input.userId,
    method: input.method,
    endpoint: input.endpoint,
    contentType,
    body,
    formFieldsJson,
    invalidateBasesJson: JSON.stringify(invalidateBases),
    createdAt: Date.now(),
    clientEntityId,
    syncBlocked: false,
    autoSyncAttempts: 0,
  };

  const db = await openOfflineMutationDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => {
      notifyOutboxChanged();
      resolve(id);
    };
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

export async function countOfflineMutationsForCurrentUser(): Promise<number> {
  const userId = getOfflineOutboxUserId();
  if (!userId) return 0;
  const rows = await listOfflineMutationsForUser(userId);
  return rows.length;
}

export async function listOfflineMutationsForCurrentUser(): Promise<
  IOfflineMutationRecord[]
> {
  const userId = getOfflineOutboxUserId();
  if (!userId) return [];
  return listOfflineMutationsForUser(userId);
}

export async function removeOfflineMutation(id: string): Promise<void> {
  const db = await openOfflineMutationDb();
  const existing = await new Promise<IOfflineMutationRecord | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as IOfflineMutationRecord | undefined);
      req.onerror = () => reject(req.error ?? new Error("get mutation failed"));
    },
  );

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = async () => {
      if (existing?.contentType === "multipart") {
        await deleteFormFieldBlobs(parseFormFields(existing.formFieldsJson));
      }
      notifyOutboxChanged();
      resolve();
    };
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
    tx.oncomplete = async () => {
      for (const row of rows) {
        if (row.contentType === "multipart") {
          await deleteFormFieldBlobs(parseFormFields(row.formFieldsJson));
        }
      }
      await clearIdRemaps();
      notifyOutboxChanged();
      resolve();
    };
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
    const tx = db.transaction([STORE, BLOB_STORE, ID_REMAP_STORE], "readwrite");
    tx.oncomplete = () => {
      notifyOutboxChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("clearAll failed"));
    tx.objectStore(STORE).clear();
    tx.objectStore(BLOB_STORE).clear();
    tx.objectStore(ID_REMAP_STORE).clear();
  });
}

export function collectDependentMutationIds(
  rows: readonly IOfflineMutationRecord[],
  target: IOfflineMutationRecord,
): string[] {
  const ids = new Set<string>([target.id]);
  if (!target.clientEntityId) {
    return [target.id];
  }
  for (const row of rows) {
    if (row.id === target.id) continue;
    if (bodyReferencesEntityId(row.body, target.clientEntityId)) {
      ids.add(row.id);
    }
  }
  return [...ids];
}

/** Removes a queued mutation and any dependents that reference its client entity id. */
export async function deleteOfflineMutationWithDependents(
  userId: string,
  mutationId: string,
): Promise<IOfflineMutationRecord[]> {
  const rows = await listOfflineMutationsForUser(userId);
  const target = rows.find((row) => row.id === mutationId);
  if (!target) return [];

  const idsToDelete = collectDependentMutationIds(rows, target);
  const deleted = rows.filter((row) => idsToDelete.includes(row.id));

  if (target.clientEntityId) {
    await removeIdRemap(target.clientEntityId);
  }

  for (const id of idsToDelete) {
    await removeOfflineMutation(id);
  }

  return deleted;
}

export async function unblockAllMutationsForUser(userId: string): Promise<void> {
  const rows = await listOfflineMutationsForUser(userId);
  for (const row of rows) {
    if (row.syncBlocked || (row.autoSyncAttempts ?? 0) > 0) {
      await updateOfflineMutationRecord({
        ...row,
        syncBlocked: false,
        autoSyncAttempts: 0,
        lastSyncError: undefined,
      });
    }
  }
}
