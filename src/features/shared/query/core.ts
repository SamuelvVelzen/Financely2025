import {
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type UseMutationOptions,
  type UseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  dispatchOfflineMutationQueued,
  isOfflineMutationQueuedError,
  OFFLINE_MUTATION_PLACEHOLDER,
  isOfflineMutationPlaceholder,
} from "@/features/shared/offline/offline-mutation-errors";
import {
  clearPendingOutboxInvalidations,
  setPendingOutboxInvalidations,
} from "@/features/shared/offline/mutation-outbox-context";

/**
 * Generic query hook wrapper with sensible defaults
 *
 * @template TQueryFnData - The data type returned by the query function
 * @template TError - The error type
 * @template TData - The selected/transformed data type (defaults to TQueryFnData)
 * @template TQueryKey - The query key type
 */
export function useFinQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>(
  options: {
    queryKey: TQueryKey;
    queryFn: () => Promise<TQueryFnData>;
    staleTime?: number;
  } & Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    refetchOnWindowFocus: true,
    ...options,
  });
}

/**
 * Generic mutation hook wrapper with automatic query invalidation
 *
 * @template TData - The data type returned by the mutation
 * @template TError - The error type
 * @template TVariables - The variables type for the mutation
 */
export function useFinMutation<
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    invalidateQueries?: Array<() => readonly unknown[]>;
    onSuccess?: (
      data: TData,
      variables: TVariables,
      context: TContext,
    ) => void | Promise<void>;
    /** Called when the mutation was stored locally for offline sync (no server round-trip yet). */
    onQueued?: (
      variables: TVariables,
      context: TContext | undefined,
      queueId: string,
    ) => void | Promise<void>;
    /** When queued offline, drives the single combined success toast (title + offline sync line). */
    getOfflineQueuedToast?: (
      variables: TVariables,
    ) => { title: string; message?: string } | undefined;
    onError?: (
      error: TError,
      variables: TVariables,
      context: TContext | undefined,
    ) => void | Promise<void>;
    onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
    onSettled?: (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      context: TContext | undefined,
    ) => void | Promise<void>;
  } & Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn" | "onSuccess"
  >,
) {
  const queryClient = useQueryClient();

  const {
    invalidateQueries = [],
    onSuccess: userOnSuccess,
    onQueued,
    getOfflineQueuedToast,
    ...restOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...restOptions,
    /** Let mutationFn run while offline so our API client can enqueue; default would pause forever. */
    networkMode: "always",
    mutationFn: async (variables: TVariables) => {
      const invalidateBases = invalidateQueries.map((fn) => [...fn().slice(0, 1)]);
      setPendingOutboxInvalidations(invalidateBases);
      try {
        return await options.mutationFn(variables);
      } catch (e: unknown) {
        if (isOfflineMutationQueuedError(e)) {
          await onQueued?.(variables, undefined, e.queueId);
          const hints = getOfflineQueuedToast?.(variables);
          dispatchOfflineMutationQueued({
            queueId: e.queueId,
            successTitle: hints?.title,
            successMessage: hints?.message,
          });
          return OFFLINE_MUTATION_PLACEHOLDER as TData;
        }
        throw e;
      } finally {
        clearPendingOutboxInvalidations();
      }
    },
    onSuccess: async (data, variables, context) => {
      if (isOfflineMutationPlaceholder(data)) {
        return;
      }
      await userOnSuccess?.(data, variables, context);

      for (const queryKeyBuilder of invalidateQueries) {
        const queryKey = queryKeyBuilder();
        const baseKey = queryKey.slice(0, 1);
        queryClient.invalidateQueries({
          queryKey: baseKey,
        });
      }
    },
  });
}

/**
 * Generic infinite query hook wrapper with sensible defaults
 *
 * @template TData - The data type returned by each page
 * @template TError - The error type
 * @template TQueryKey - The query key type
 * @template TPageParam - The page parameter type
 */
export function useFinInfiniteQuery<
  TData,
  TError = Error,
  TQueryKey extends readonly unknown[] = readonly unknown[],
  TPageParam = number,
>(
  options: {
    queryKey: TQueryKey;
    queryFn: (context: { pageParam: TPageParam }) => Promise<TData>;
    getNextPageParam: (
      lastPage: TData,
      allPages: TData[],
    ) => TPageParam | undefined;
    initialPageParam: TPageParam;
    staleTime?: number;
  } & Omit<
    UseInfiniteQueryOptions<
      TData,
      TError,
      InfiniteData<TData>,
      TQueryKey,
      TPageParam
    >,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >,
): UseInfiniteQueryResult<InfiniteData<TData>, TError> {
  const { queryFn: userQueryFn, ...restOptions } = options;

  return useInfiniteQuery<
    TData,
    TError,
    InfiniteData<TData>,
    TQueryKey,
    TPageParam
  >({
    refetchOnWindowFocus: true,
    queryFn: ({ pageParam }) =>
      userQueryFn({ pageParam: pageParam as TPageParam }),
    ...restOptions,
  });
}
