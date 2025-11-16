import {
  useFinInfiniteQuery,
  useFinMutation,
  useFinQuery,
} from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  CreateTransactionInput,
  PaginatedTransactionsResponse,
  Transaction,
  TransactionsQuery,
  UpdateTransactionInput,
} from "@/features/shared/validation/schemas";
import { useQueryClient } from "@tanstack/react-query";
import {
  addTagToTransaction,
  createTransaction,
  deleteTransaction,
  getTransactions,
  removeTagFromTransaction,
  updateTransaction,
} from "../api/client";

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

// ============================================================================
// Expense hooks (transactions with type EXPENSE)
// ============================================================================

/**
 * Query expenses list (transactions with type EXPENSE)
 * - staleTime: 30 seconds (short, transactions change frequently)
 * - Supports pagination, filtering, sorting
 */
export function useExpenses(query?: Omit<TransactionsQuery, "type">) {
  return useFinQuery<PaginatedTransactionsResponse, Error>({
    queryKey: queryKeys.expenses(query),
    queryFn: () =>
      getTransactions({ ...query, type: "EXPENSE" } as TransactionsQuery),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Create expense mutation
 * - Invalidates expenses and transactions queries on success
 */
export function useCreateExpense() {
  return useFinMutation<
    Transaction,
    Error,
    Omit<CreateTransactionInput, "type">
  >({
    mutationFn: (input) => createTransaction({ ...input, type: "EXPENSE" }),
    invalidateQueries: [queryKeys.expenses, queryKeys.transactions],
  });
}

/**
 * Update expense mutation
 * - Invalidates expenses and transactions queries on success
 */
export function useUpdateExpense() {
  return useFinMutation<
    Transaction,
    Error,
    { transactionId: string; input: Omit<UpdateTransactionInput, "type"> }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(transactionId, input),
    invalidateQueries: [queryKeys.expenses, queryKeys.transactions],
  });
}

/**
 * Delete expense mutation
 * - Invalidates expenses and transactions queries on success
 */
export function useDeleteExpense() {
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteTransaction,
    invalidateQueries: [queryKeys.expenses, queryKeys.transactions],
  });
}

// ============================================================================
// Income hooks (transactions with type INCOME)
// ============================================================================

/**
 * Query incomes list (transactions with type INCOME)
 * - staleTime: 30 seconds (short, transactions change frequently)
 * - Supports pagination, filtering, sorting
 */
export function useIncomes(query?: Omit<TransactionsQuery, "type">) {
  return useFinQuery<PaginatedTransactionsResponse, Error>({
    queryKey: queryKeys.incomes(query),
    queryFn: () =>
      getTransactions({ ...query, type: "INCOME" } as TransactionsQuery),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Create income mutation
 * - Invalidates incomes and transactions queries on success
 */
export function useCreateIncome() {
  return useFinMutation<
    Transaction,
    Error,
    Omit<CreateTransactionInput, "type">
  >({
    mutationFn: (input) => createTransaction({ ...input, type: "INCOME" }),
    invalidateQueries: [queryKeys.incomes, queryKeys.transactions],
  });
}

/**
 * Update income mutation
 * - Invalidates incomes and transactions queries on success
 */
export function useUpdateIncome() {
  return useFinMutation<
    Transaction,
    Error,
    { transactionId: string; input: Omit<UpdateTransactionInput, "type"> }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(transactionId, input),
    invalidateQueries: [queryKeys.incomes, queryKeys.transactions],
  });
}

/**
 * Delete income mutation
 * - Invalidates incomes and transactions queries on success
 */
export function useDeleteIncome() {
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteTransaction,
    invalidateQueries: [queryKeys.incomes, queryKeys.transactions],
  });
}
