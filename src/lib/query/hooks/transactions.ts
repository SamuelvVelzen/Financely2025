import {
  addTagToTransaction,
  createTransaction,
  deleteTransaction,
  getTransactions,
  removeTagFromTransaction,
  updateTransaction,
} from "@/lib/api/endpoints";
import type {
  CreateTransactionInput,
  PaginatedTransactionsResponse,
  Transaction,
  TransactionsQuery,
  UpdateTransactionInput,
} from "@/lib/validation/schemas";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { useFinInfiniteQuery, useFinMutation, useFinQuery } from "./core";

/**
 * Query transactions with pagination
 * - staleTime: 30 seconds (short, transactions change frequently)
 * - Supports pagination, filtering, sorting
 */
export function useTransactions(query?: TransactionsQuery) {
  return useFinQuery<PaginatedTransactionsResponse, Error>({
    queryKey: queryKeys.transactions(query),
    queryFn: () => getTransactions(query),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Infinite query for transactions (for infinite scroll)
 * - Automatically handles pagination
 */
export function useInfiniteTransactions(
  query?: Omit<TransactionsQuery, "page">
) {
  return useFinInfiniteQuery<
    PaginatedTransactionsResponse,
    Error,
    ReturnType<typeof queryKeys.transactions>,
    number
  >({
    queryKey: queryKeys.transactions({ ...query, page: undefined }),
    queryFn: ({ pageParam = 1 }) => {
      const transactionsQuery = {
        ...query,
        page: pageParam,
      } as TransactionsQuery;
      return getTransactions(transactionsQuery);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
}

/**
 * Create transaction mutation
 * - Invalidates transactions query on success
 */
export function useCreateTransaction() {
  return useFinMutation<Transaction, Error, CreateTransactionInput>({
    mutationFn: createTransaction,
    invalidateQueries: [queryKeys.transactions],
  });
}

/**
 * Update transaction mutation
 * - Invalidates transactions query on success
 */
export function useUpdateTransaction() {
  return useFinMutation<
    Transaction,
    Error,
    { transactionId: string; input: UpdateTransactionInput }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(transactionId, input),
    invalidateQueries: [queryKeys.transactions],
  });
}

/**
 * Delete transaction mutation
 * - Invalidates transactions query on success
 */
export function useDeleteTransaction() {
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteTransaction,
    invalidateQueries: [queryKeys.transactions],
  });
}

/**
 * Add tag to transaction mutation
 * - Optimistic update for instant UI feedback
 * - Invalidates transactions query on success
 */
export function useAddTagToTransaction() {
  const queryClient = useQueryClient();

  return useFinMutation<
    Transaction,
    Error,
    { transactionId: string; tagId: string },
    {
      previousTransactions: Array<
        [unknown, PaginatedTransactionsResponse | undefined]
      >;
    }
  >({
    mutationFn: ({ transactionId, tagId }) =>
      addTagToTransaction(transactionId, tagId),
    invalidateQueries: [queryKeys.transactions],
    onMutate: async ({ transactionId, tagId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions(),
      });

      // Snapshot previous value for rollback
      const previousTransactions =
        queryClient.getQueriesData<PaginatedTransactionsResponse>({
          queryKey: queryKeys.transactions(),
        });

      // Optimistically update
      queryClient.setQueriesData<PaginatedTransactionsResponse>(
        { queryKey: queryKeys.transactions() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((tx) => {
              if (tx.id === transactionId) {
                return {
                  ...tx,
                  tags: [
                    ...tx.tags,
                    { id: tagId, name: "" }, // We don't have tag name yet, will be fixed on refetch
                  ],
                };
              }
              return tx;
            }),
          };
        }
      );

      return { previousTransactions };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (
        context &&
        typeof context === "object" &&
        "previousTransactions" in context
      ) {
        const previousTransactions = context.previousTransactions as Array<
          [unknown, PaginatedTransactionsResponse | undefined]
        >;
        previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], data);
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(),
      });
    },
  });
}

/**
 * Remove tag from transaction mutation
 * - Optimistic update for instant UI feedback
 * - Invalidates transactions query on success
 */
export function useRemoveTagFromTransaction() {
  const queryClient = useQueryClient();

  return useFinMutation<
    Transaction,
    Error,
    { transactionId: string; tagId: string },
    {
      previousTransactions: Array<
        [unknown, PaginatedTransactionsResponse | undefined]
      >;
    }
  >({
    mutationFn: ({ transactionId, tagId }) =>
      removeTagFromTransaction(transactionId, tagId),
    invalidateQueries: [queryKeys.transactions],
    onMutate: async ({ transactionId, tagId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions(),
      });

      // Snapshot previous value
      const previousTransactions =
        queryClient.getQueriesData<PaginatedTransactionsResponse>({
          queryKey: queryKeys.transactions(),
        });

      // Optimistically update
      queryClient.setQueriesData<PaginatedTransactionsResponse>(
        { queryKey: queryKeys.transactions() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((tx) => {
              if (tx.id === transactionId) {
                return {
                  ...tx,
                  tags: tx.tags.filter((tag) => tag.id !== tagId),
                };
              }
              return tx;
            }),
          };
        }
      );

      return { previousTransactions };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (
        context &&
        typeof context === "object" &&
        "previousTransactions" in context
      ) {
        const previousTransactions = context.previousTransactions as Array<
          [unknown, PaginatedTransactionsResponse | undefined]
        >;
        previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], data);
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(),
      });
    },
  });
}
