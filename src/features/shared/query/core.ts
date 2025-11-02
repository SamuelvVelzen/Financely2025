import {
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * Generic query hook wrapper with sensible defaults
 *
 * @template TData - The data type returned by the query
 * @template TError - The error type
 * @template TQueryKey - The query key type
 */
export function useFinQuery<
  TData,
  TError = Error,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>(
  options: {
    queryKey: TQueryKey;
    queryFn: () => Promise<TData>;
    staleTime?: number;
  } & Omit<
    UseQueryOptions<TData, TError, TData, TQueryKey>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<TData, TError, TData, TQueryKey>({
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
      context: TContext
    ) => void | Promise<void>;
    onError?: (
      error: TError,
      variables: TVariables,
      context: TContext | undefined
    ) => void | Promise<void>;
    onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
    onSettled?: (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      context: TContext | undefined
    ) => void | Promise<void>;
  } & Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn" | "onSuccess"
  >
) {
  const queryClient = useQueryClient();

  const {
    invalidateQueries = [],
    onSuccess: userOnSuccess,
    ...restOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...restOptions,
    mutationFn: options.mutationFn,
    onSuccess: async (data, variables, context) => {
      // Call user's onSuccess if provided
      await userOnSuccess?.(data, variables, context);

      // Invalidate queries
      for (const queryKeyBuilder of invalidateQueries) {
        queryClient.invalidateQueries({
          queryKey: queryKeyBuilder(),
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
      allPages: TData[]
    ) => TPageParam | undefined;
    initialPageParam: TPageParam;
    staleTime?: number;
  } & Omit<
    UseInfiniteQueryOptions<TData, TError, TData, TQueryKey, TPageParam>,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >
) {
  const { queryFn: userQueryFn, ...restOptions } = options;

  return useInfiniteQuery<TData, TError, TData, TQueryKey, TPageParam>({
    refetchOnWindowFocus: true,
    queryFn: ({ pageParam }) =>
      userQueryFn({ pageParam: pageParam as TPageParam }),
    ...restOptions,
  });
}
