import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import {
  buildOptimisticTransaction,
  defaultTransactionInfiniteSeedKey,
  mergeTransactionUpdate,
  prependToPaginatedCaches,
  removeFromPaginatedCaches,
  snapshotForPrefixes,
  transactionListPrefixes,
  updateInPaginatedCaches,
} from "@/features/shared/offline/optimistic-cache";
import { setPendingClientEntityId } from "@/features/shared/offline/optimistic-entity-context";
import {
  useFinInfiniteQuery,
  useFinMutation,
  useFinQuery,
} from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICreateTransactionInput,
  IPaginatedTransactionsResponse,
  ITag,
  ITransaction,
  ITagsResponse,
  ITransactionsQuery,
  IUpdateTransactionInput,
} from "@/features/shared/validation/schemas";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  addTagToTransaction,
  createTransaction,
  deleteRefundAllocation,
  deleteTransaction,
  getRefundAllocationSuggestions,
  getTransaction,
  getTransactions,
  removeTagFromTransaction,
  replaceRefundAllocations,
  updateTransaction,
} from "../api/client";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import type { IRefundAllocationSuggestionsResponse } from "@/features/shared/validation/schemas";

function requireWorkspaceId(id: number | null): number {
  if (id == null) {
    throw new Error("Workspace is required");
  }
  return id;
}

function resolveTagSnapshotFromCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: number,
  tagId: string,
): ITag | null {
  const entries = queryClient.getQueriesData<ITagsResponse>({
    queryKey: ["tags", workspaceId],
  });
  for (const [, data] of entries) {
    const tag = data?.data.find((row) => row.id === tagId);
    if (tag) return tag;
  }
  return null;
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<ITransaction, Error, ICreateTransactionInput>({
    mutationFn: (input) =>
      createTransaction(requireWorkspaceId(workspaceId), input),
    invalidateQueries: [() => queryKeys.transactions(wid)],
    onMutate: async (input) => {
      const tempId = crypto.randomUUID();
      setPendingClientEntityId(tempId);
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      const optimistic = buildOptimisticTransaction(input, tempId, (tagId) => {
        const tag = resolveTagSnapshotFromCaches(queryClient, wid, tagId);
        return (
          tag ?? {
            id: tagId,
            name: "Unsynced tag",
            color: null,
            emoticon: null,
            order: 0,
            transactionType: input.type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      });
      prependToPaginatedCaches(queryClient, prefixes, optimistic, {
        seedInfiniteKeysIfEmpty: [defaultTransactionInfiniteSeedKey(wid)],
      });
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Transaction created successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Update transaction mutation
 * - Invalidates transactions query on success
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; input: IUpdateTransactionInput }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(requireWorkspaceId(workspaceId), transactionId, input),
    invalidateQueries: [
      () => queryKeys.transactions(wid),
      () => queryKeys.expenses(wid),
      () => queryKeys.incomes(wid),
      () => queryKeys.subscriptions(wid),
    ],
    onMutate: async ({ transactionId, input }) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      updateInPaginatedCaches<ITransaction>(
        queryClient,
        prefixes,
        transactionId,
        (tx) => mergeTransactionUpdate(tx, input),
      );
      return { snapshot };
    },
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => deleteTransaction(requireWorkspaceId(workspaceId), id),
    invalidateQueries: [() => queryKeys.transactions(wid)],
    onMutate: async (id) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      removeFromPaginatedCaches(queryClient, prefixes, id);
      return { snapshot };
    },
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
                    { id: tagId, name: "", color: null },
                  ],
                };
              }
              return tx;
            }),
          };
        },
      );

      return { previousTransactions };
    },
    getOfflineQueuedToast: () => ({
      title: "Tag added to transaction",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
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
    getOfflineQueuedToast: () => ({
      title: "Tag removed from transaction",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<
    ITransaction,
    Error,
    Omit<ICreateTransactionInput, "type">
  >({
    mutationFn: (input) =>
      createTransaction(requireWorkspaceId(workspaceId), { ...input, type: "EXPENSE" }),
    invalidateQueries: [
      () => queryKeys.expenses(wid),
      () => queryKeys.transactions(wid),
    ],
    onMutate: async (input) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      prependToPaginatedCaches(
        queryClient,
        prefixes,
        buildOptimisticTransaction({ ...input, type: "EXPENSE" }),
      );
      return { snapshot };
    },
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; input: IUpdateTransactionInput }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(requireWorkspaceId(workspaceId), transactionId, input),
    invalidateQueries: [
      () => queryKeys.expenses(wid),
      () => queryKeys.incomes(wid),
      () => queryKeys.transactions(wid),
      () => queryKeys.subscriptions(wid),
    ],
    onMutate: async ({ transactionId, input }) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      updateInPaginatedCaches<ITransaction>(
        queryClient,
        prefixes,
        transactionId,
        (tx) => mergeTransactionUpdate(tx, input),
      );
      return { snapshot };
    },
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => deleteTransaction(requireWorkspaceId(workspaceId), id),
    invalidateQueries: [
      () => queryKeys.expenses(wid),
      () => queryKeys.transactions(wid),
    ],
    onMutate: async (id) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      removeFromPaginatedCaches(queryClient, prefixes, id);
      return { snapshot };
    },
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<
    ITransaction,
    Error,
    Omit<ICreateTransactionInput, "type">
  >({
    mutationFn: (input) =>
      createTransaction(requireWorkspaceId(workspaceId), { ...input, type: "INCOME" }),
    invalidateQueries: [
      () => queryKeys.incomes(wid),
      () => queryKeys.transactions(wid),
    ],
    onMutate: async (input) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      prependToPaginatedCaches(
        queryClient,
        prefixes,
        buildOptimisticTransaction({ ...input, type: "INCOME" }),
      );
      return { snapshot };
    },
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; input: IUpdateTransactionInput }
  >({
    mutationFn: ({ transactionId, input }) =>
      updateTransaction(requireWorkspaceId(workspaceId), transactionId, input),
    invalidateQueries: [
      () => queryKeys.expenses(wid),
      () => queryKeys.incomes(wid),
      () => queryKeys.transactions(wid),
      () => queryKeys.subscriptions(wid),
    ],
    onMutate: async ({ transactionId, input }) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      updateInPaginatedCaches<ITransaction>(
        queryClient,
        prefixes,
        transactionId,
        (tx) => mergeTransactionUpdate(tx, input),
      );
      return { snapshot };
    },
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => deleteTransaction(requireWorkspaceId(workspaceId), id),
    invalidateQueries: [
      () => queryKeys.incomes(wid),
      () => queryKeys.transactions(wid),
    ],
    onMutate: async (id) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      removeFromPaginatedCaches(queryClient, prefixes, id);
      return { snapshot };
    },
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

/**
 * Replace refund allocations for an income transaction
 */
export function useReplaceRefundAllocations() {
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<
    ITransaction,
    Error,
    {
      transactionId: string;
      allocations:
        | { expenseTransactionId: string; amount: string }[]
        | { refundTransactionId: string; amount: string }[];
    }
  >({
    mutationFn: ({ transactionId, allocations }) =>
      replaceRefundAllocations(
        requireWorkspaceId(workspaceId),
        transactionId,
        allocations,
      ),
    invalidateQueries: [
      () => queryKeys.transactions(wid),
      () => queryKeys.incomes(wid),
      () => queryKeys.expenses(wid),
      () => queryKeys.budgets(wid),
    ],
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.transaction(wid, data.id), data);
    },
  });
}

/**
 * Delete a single refund allocation
 */
export function useDeleteRefundAllocation() {
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<
    ITransaction,
    Error,
    { transactionId: string; allocationId: string }
  >({
    mutationFn: ({ transactionId, allocationId }) =>
      deleteRefundAllocation(
        requireWorkspaceId(workspaceId),
        transactionId,
        allocationId,
      ),
    invalidateQueries: [
      () => queryKeys.transactions(wid),
      () => queryKeys.incomes(wid),
      () => queryKeys.expenses(wid),
      () => queryKeys.budgets(wid),
    ],
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.transaction(wid, data.id), data);
    },
  });
}

/**
 * Suggest expenses to allocate against a refund
 */
export function useRefundAllocationSuggestions(
  transactionId: string | null,
  enabled = true,
) {
  const workspaceId = useNavWorkspaceId();
  const canFetch = workspaceId != null && !!transactionId && enabled;
  return useFinQuery<IRefundAllocationSuggestionsResponse, Error>({
    queryKey: canFetch
      ? ([
          "transactions",
          workspaceId,
          transactionId,
          "refund-allocation-suggestions",
        ] as const)
      : (["transactions", "disabled", "refund-suggestions"] as const),
    queryFn: () =>
      getRefundAllocationSuggestions(
        requireWorkspaceId(workspaceId),
        transactionId!,
      ),
    staleTime: 15 * 1000,
    enabled: canFetch,
  });
}
