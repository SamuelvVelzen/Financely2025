import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { useEffect, useState, type ReactNode } from "react";
import { createQueryIdbPersister } from "./create-query-idb-persister";

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours
const PERSIST_KEY = "financely-react-query";

/**
 * Create a new QueryClient with default options
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time configurations per resource type
        staleTime: 30 * 1000, // 30 seconds default (short for transactions)
        // Keep cached data long enough for IndexedDB persistence / offline reads
        gcTime: CACHE_MAX_AGE_MS,
        retry: 2, // Retry failed requests 2 times
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false, // Don't retry mutations by default
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;
let persistRestorePromise: Promise<void> | undefined = undefined;

/**
 * Get or create the QueryClient
 * Uses singleton pattern to avoid recreating on every render
 */
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: use singleton pattern
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

function ensurePersistedClientRestored(queryClient: QueryClient): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (persistRestorePromise) {
    return persistRestorePromise;
  }

  const persister = createQueryIdbPersister(PERSIST_KEY);
  const [unsubscribe, restorePromise] = persistQueryClient({
    queryClient,
    persister,
    maxAge: CACHE_MAX_AGE_MS,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => query.state.status === "success",
    },
  });

  persistRestorePromise = restorePromise
    .catch((error: unknown) => {
      console.warn("[query] Failed to restore persisted cache", error);
    })
    .then(() => undefined);

  // Keep unsubscribe available for HMR / full remounts via the shared promise lifetime
  void persistRestorePromise.finally(() => {
    // no-op: persistence subscription stays for the page lifetime
    void unsubscribe;
  });

  return persistRestorePromise;
}

/**
 * QueryClientProvider wrapper with IndexedDB persistence for offline reads.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  // Wait for IndexedDB hydrate before rendering so restore cannot wipe optimistic writes
  const [persistReady, setPersistReady] = useState(
    typeof window === "undefined",
  );

  useEffect(() => {
    let cancelled = false;
    void ensurePersistedClientRestored(queryClient).finally(() => {
      if (!cancelled) {
        setPersistReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {persistReady ? children : null}
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
