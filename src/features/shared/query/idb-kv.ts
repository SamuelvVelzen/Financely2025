const DB_NAME = "financely-kv";
const DB_VERSION = 1;
const STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

/** Tiny IndexedDB key/value helpers (replaces idb-keyval). */
export async function idbGet(key: string): Promise<string | undefined> {
  const db = await openDb();
  try {
    const value = await requestToPromise(
      db.transaction(STORE, "readonly").objectStore(STORE).get(key)
    );
    return typeof value === "string" ? value : undefined;
  } finally {
    db.close();
  }
}

export async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  try {
    await requestToPromise(
      db.transaction(STORE, "readwrite").objectStore(STORE).put(value, key)
    );
  } finally {
    db.close();
  }
}

export async function idbDel(key: string): Promise<void> {
  const db = await openDb();
  try {
    await requestToPromise(
      db.transaction(STORE, "readwrite").objectStore(STORE).delete(key)
    );
  } finally {
    db.close();
  }
}
