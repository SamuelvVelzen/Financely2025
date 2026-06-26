import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import {
  useFinInfiniteQuery,
  useFinMutation,
  useFinQuery,
} from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICreateTransactionInput,
  IPaginatedTransactionsResponse,
  ITransaction,
  ITransactionsQuery,
  IUpdateTransactionInput,
} from "@/features/shared/validation/schemas";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  addTagToTransaction,
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  removeTagFromTransaction,
  updateTransaction,
} from "../api/client";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";

function requireWorkspaceId(id: number | null): number {
  if (id == null) {
    throw new Error("Workspace is required");
  }
  return id;
}

/**
 * Query transactions with pagination
 * - staleTime: 30 seconds (short, transactions change frequently)
 * - Supports pagination, filtering, sorting
 */
export function useTransactions(query?: ITransactionsQuery) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<IPaginatedTransactionsResponse, Error>({
    queryKey: enabled
      ? queryKeys.transactions(workspaceId, query)
      : (["transactions", "disabled"] as const),
    queryFn: () =>
      getTransactions(requireWorkspaceId(workspaceId), query),
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  });
}

/**
 * Get a single transaction by ID
 */
export function useTransaction(transactionId: string | null) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null && !!transactionId;
  return useFinQuery<ITransaction, Error>({
    queryKey: enabled
      ? queryKeys.transaction(workspaceId, transactionId!)
      : (["transactions", "disabled"] as const),
    queryFn: () =>
      getTransaction(requireWorkspaceId(workspaceId), transactionId!),
    staleTime: 30 * 1000,
    enabled,
  });
}

/**
 * Infinite query for transactions (for infinite scroll)
 * - Automatically handles pagination
 */
export function useInfiniteTransactions(
  query?: Omit<ITransactionsQuery, "page">
) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinInfiniteQuery<
    IPaginatedTransactionsResponse,
    Error,
    readonly unknown[],
    number
  >({
    queryKey: enabled
      ? queryKeys.transactions(workspaceId, { ...query, page: undefined })
      : (["transactions", "disabled"] as const),
    queryFn: ({ pageParam = 1 }) => {
      const transactionsQuery = {
        ...query,
        page: pageParam,
      } as ITransactionsQuery;
      return getTransactions(requireWorkspaceId(workspaceId), transactionsQuery);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
    enabled,
  });
}

/**
 * Create transaction mutation
 * - Invalidates transactions query on success
 */
export function useCreateTransaction() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITransaction, Error, ICreateTransactionInput>({
    mutationFn: (input) =>
      createTransaction(requireWorkspaceId(workspaceId), input),
    invalidateQueries: [() => queryKeys.transactions(workspaceId!)],
  });
}

/**
 * Update transaction mutation
 * - Invalidates transactions query on success
 */
export function useUpdateTransaction() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; input: IUpdateTransactionInput }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(requireWorkspaceId(workspaceId), transactionId, input),
    invalidateQueries: [
      () => queryKeys.transactions(workspaceId!),
      () => queryKeys.expenses(workspaceId!),
      () => queryKeys.incomes(workspaceId!),
      () => queryKeys.subscriptions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Transaction updated successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Delete transaction mutation
 * - Invalidates transactions query on success
 */
export function useDeleteTransaction() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => deleteTransaction(requireWorkspaceId(workspaceId), id),
    invalidateQueries: [() => queryKeys.transactions(workspaceId!)],
    getOfflineQueuedToast: () => ({
      title: "Transaction deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Add tag to transaction mutation
 * - Optimistic update for instant UI feedback
 * - Invalidates transactions query on success
 */
export function useAddTagToTransaction() {
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();

  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; tagId: string },
    {
      previousTransactions: Array<
        [unknown, IPaginatedTransactionsResponse | undefined]
      >;
    }
  >({
    mutationFn: ({ transactionId, tagId }) =>
      addTagToTransaction(requireWorkspaceId(workspaceId), transactionId, tagId),
    invalidateQueries: [() => queryKeys.transactions(workspaceId!)],
    onMutate: async ({ transactionId, tagId }) => {
      await queryClient.cancelQueries({
        queryKey: ["transactions", workspaceId],
      });

      const previousTransactions =
        queryClient.getQueriesData<IPaginatedTransactionsResponse>({
          queryKey: ["transactions", workspaceId],
        });

      queryClient.setQueriesData<IPaginatedTransactionsResponse>(
        { queryKey: ["transactions", workspaceId] },
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
                    { id: tagId, name: "", color: null }, // We don't have tag name yet, will be fixed on refetch
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
          [unknown, IPaginatedTransactionsResponse | undefined]
        >;
        previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", workspaceId],
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
  const workspaceId = useNavWorkspaceId();

  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; tagId: string },
    {
      previousTransactions: Array<
        [unknown, IPaginatedTransactionsResponse | undefined]
      >;
    }
  >({
    mutationFn: ({ transactionId, tagId }) =>
      removeTagFromTransaction(requireWorkspaceId(workspaceId), transactionId, tagId),
    invalidateQueries: [() => queryKeys.transactions(workspaceId!)],
    onMutate: async ({ transactionId, tagId }) => {
      await queryClient.cancelQueries({
        queryKey: ["transactions", workspaceId],
      });

      const previousTransactions =
        queryClient.getQueriesData<IPaginatedTransactionsResponse>({
          queryKey: ["transactions", workspaceId],
        });

      queryClient.setQueriesData<IPaginatedTransactionsResponse>(
        { queryKey: ["transactions", workspaceId] },
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
          [unknown, IPaginatedTransactionsResponse | undefined]
        >;
        previousTransactions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", workspaceId],
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
export function useExpenses(
  query?: Omit<ITransactionsQuery, "type">,
  options?: Omit<
    UseQueryOptions<
      IPaginatedTransactionsResponse,
      Error,
      IPaginatedTransactionsResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn" | "staleTime"
  >
) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<IPaginatedTransactionsResponse, Error>({
    queryKey: enabled
      ? queryKeys.expenses(workspaceId, query)
      : (["expenses", "disabled"] as const),
    queryFn: () =>
      getTransactions(requireWorkspaceId(workspaceId), {
        ...query,
        type: "EXPENSE",
      } as ITransactionsQuery),
    staleTime: 30_000, // 30 seconds
    enabled,
    ...(options ?? {}),
  });
}

/**
 * Create expense mutation
 * - Invalidates expenses and transactions queries on success
 */
export function useCreateExpense() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<
    ITransaction,
    Error,
    Omit<ICreateTransactionInput, "type">
  >({
    mutationFn: (input) =>
      createTransaction(requireWorkspaceId(workspaceId), { ...input, type: "EXPENSE" }),
    invalidateQueries: [
      () => queryKeys.expenses(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Expense created successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Update expense mutation
 * - Invalidates expenses and transactions queries on success
 */
export function useUpdateExpense() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; input: IUpdateTransactionInput }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(requireWorkspaceId(workspaceId), transactionId, input),
    invalidateQueries: [
      () => queryKeys.expenses(workspaceId!),
      () => queryKeys.incomes(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
      () => queryKeys.subscriptions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Expense updated successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Delete expense mutation
 * - Invalidates expenses and transactions queries on success
 */
export function useDeleteExpense() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => deleteTransaction(requireWorkspaceId(workspaceId), id),
    invalidateQueries: [
      () => queryKeys.expenses(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Expense deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Infinite query for expenses (for infinite scroll)
 * - Automatically handles pagination
 */
export function useInfiniteExpenses(
  query?: Omit<ITransactionsQuery, "type" | "page">
) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinInfiniteQuery<
    IPaginatedTransactionsResponse,
    Error,
    readonly unknown[],
    number
  >({
    queryKey: enabled
      ? queryKeys.expenses(workspaceId, { ...query, page: undefined })
      : (["expenses", "disabled"] as const),
    queryFn: ({ pageParam = 1 }) => {
      const expensesQuery = {
        ...query,
        type: "EXPENSE" as const,
        page: pageParam,
      } as ITransactionsQuery;
      return getTransactions(requireWorkspaceId(workspaceId), expensesQuery);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
    enabled,
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
export function useIncomes(
  query?: Omit<ITransactionsQuery, "type">,
  options?: Omit<
    UseQueryOptions<
      IPaginatedTransactionsResponse,
      Error,
      IPaginatedTransactionsResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn" | "staleTime"
  >
) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<IPaginatedTransactionsResponse, Error>({
    queryKey: enabled
      ? queryKeys.incomes(workspaceId, query)
      : (["incomes", "disabled"] as const),
    queryFn: () =>
      getTransactions(requireWorkspaceId(workspaceId), {
        ...query,
        type: "INCOME",
      } as ITransactionsQuery),
    staleTime: 30 * 1000, // 30 seconds
    enabled,
    ...options,
  });
}

/**
 * Create income mutation
 * - Invalidates incomes and transactions queries on success
 */
export function useCreateIncome() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<
    ITransaction,
    Error,
    Omit<ICreateTransactionInput, "type">
  >({
    mutationFn: (input) =>
      createTransaction(requireWorkspaceId(workspaceId), { ...input, type: "INCOME" }),
    invalidateQueries: [
      () => queryKeys.incomes(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Income created successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Update income mutation
 * - Invalidates incomes and transactions queries on success
 */
export function useUpdateIncome() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; input: IUpdateTransactionInput }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(requireWorkspaceId(workspaceId), transactionId, input),
    invalidateQueries: [
      () => queryKeys.expenses(workspaceId!),
      () => queryKeys.incomes(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
      () => queryKeys.subscriptions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Income updated successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Delete income mutation
 * - Invalidates incomes and transactions queries on success
 */
export function useDeleteIncome() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => deleteTransaction(requireWorkspaceId(workspaceId), id),
    invalidateQueries: [
      () => queryKeys.incomes(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Income deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Infinite query for incomes (for infinite scroll)
 * - Automatically handles pagination
 */
export function useInfiniteIncomes(
  query?: Omit<ITransactionsQuery, "type" | "page">
) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinInfiniteQuery<
    IPaginatedTransactionsResponse,
    Error,
    readonly unknown[],
    number
  >({
    queryKey: enabled
      ? queryKeys.incomes(workspaceId, { ...query, page: undefined })
      : (["incomes", "disabled"] as const),
    queryFn: ({ pageParam = 1 }) => {
      const incomesQuery = {
        ...query,
        type: "INCOME" as const,
        page: pageParam,
      } as ITransactionsQuery;
      return getTransactions(requireWorkspaceId(workspaceId), incomesQuery);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
    enabled,
  });
}
