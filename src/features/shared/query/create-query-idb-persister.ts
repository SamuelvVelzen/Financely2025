import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { idbDel, idbGet, idbSet } from "./idb-kv";

/**
 * TanStack Query persister backed by our IndexedDB key/value store.
 * Avoids @tanstack/query-async-storage-persister + idb-keyval.
 */
export function createQueryIdbPersister(key: string): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await idbSet(key, JSON.stringify(client));
    },
    restoreClient: async () => {
      const raw = await idbGet(key);
      if (!raw) return undefined;
      return JSON.parse(raw) as PersistedClient;
    },
    removeClient: async () => {
      await idbDel(key);
    },
  };
}
