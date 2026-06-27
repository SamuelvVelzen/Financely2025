import {
  createBudget,
  deleteBudget,
  getBudget,
  getBudgetComparison,
  getBudgets,
  getBudgetsOverview,
  updateBudget,
} from "@/features/budget/api/client";
import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import {
  buildOptimisticBudget,
  prependToDataListCaches,
  removeFromDataListCaches,
  snapshotForPrefixes,
  updateInDataListCaches,
} from "@/features/shared/offline/optimistic-cache";
import { getOfflineOutboxUserId } from "@/features/shared/offline/offline-mutation-outbox";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import type {
  IBudget,
  IBudgetComparison,
  IBudgetsOverviewResponse,
  IBudgetsQuery,
  IBudgetsResponse,
  ICreateBudgetInput,
  IUpdateBudgetInput,
} from "@/features/shared/validation/schemas";
import { useQueryClient } from "@tanstack/react-query";

export function useBudgets(query?: IBudgetsQuery) {
  const workspaceId = useActiveWorkspaceId();
  return useFinQuery<IBudgetsResponse, Error>({
    queryKey: queryKeys.budgets(workspaceId, query),
    queryFn: () => getBudgets(workspaceId, query),
    staleTime: 2 * 60 * 1000,
  });
}

export function useBudget(budgetId: string) {
  const workspaceId = useActiveWorkspaceId();
  return useFinQuery<IBudget, Error>({
    queryKey: queryKeys.budget(workspaceId, budgetId),
    queryFn: () => getBudget(workspaceId, budgetId),
    staleTime: 2 * 60 * 1000,
    ...(budgetId ? {} : { enabled: false }),
  });
}

export function useBudgetComparison(budgetId: string) {
  const workspaceId = useActiveWorkspaceId();
  return useFinQuery<IBudgetComparison, Error>({
    queryKey: queryKeys.budgetComparison(workspaceId, budgetId),
    queryFn: () => getBudgetComparison(workspaceId, budgetId),
    staleTime: 30 * 1000,
    ...(budgetId ? {} : { enabled: false }),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  return useFinMutation<IBudget, Error, ICreateBudgetInput>({
    mutationFn: (input) => createBudget(workspaceId, input),
    invalidateQueries: [
      () => queryKeys.budgets(workspaceId),
      () => queryKeys.budgetsOverview(workspaceId),
    ],
    onMutate: async (input) => {
      const prefix = ["budgets", workspaceId] as const;
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      prependToDataListCaches(
        queryClient,
        [prefix],
        buildOptimisticBudget(input, getOfflineOutboxUserId() ?? "local"),
      );
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Budget created successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useUpdateBudget() {
  const workspaceId = useActiveWorkspaceId();
  const queryClient = useQueryClient();

  return useFinMutation<
    IBudget,
    Error,
    { budgetId: string; input: IUpdateBudgetInput }
  >({
    mutationFn: ({ budgetId, input }) =>
      updateBudget(workspaceId, budgetId, input),
    invalidateQueries: [
      () => queryKeys.budgets(workspaceId),
      () => queryKeys.budgetsOverview(workspaceId),
    ],
    onMutate: async ({ budgetId, input }) => {
      const prefix = ["budgets", workspaceId] as const;
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      updateInDataListCaches<IBudget>(queryClient, [prefix], budgetId, (b) => ({
        ...b,
        name: input.name ?? b.name,
        periodType: input.periodType ?? b.periodType,
        startDate: input.startDate ?? b.startDate,
        endDate: input.endDate ?? b.endDate,
        currency: input.currency ?? b.currency,
        updatedAt: new Date().toISOString(),
      }));
      return { snapshot };
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budget(workspaceId, variables.budgetId),
      });
    },
    getOfflineQueuedToast: () => ({
      title: "Budget updated successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (budgetId) => deleteBudget(workspaceId, budgetId),
    invalidateQueries: [
      () => queryKeys.budgets(workspaceId),
      () => queryKeys.budgetsOverview(workspaceId),
    ],
    onMutate: async (budgetId) => {
      const prefix = ["budgets", workspaceId] as const;
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      removeFromDataListCaches(queryClient, [prefix], budgetId);
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Budget deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useBudgetsOverview() {
  const workspaceId = useActiveWorkspaceId();
  return useFinQuery<IBudgetsOverviewResponse, Error>({
    queryKey: queryKeys.budgetsOverview(workspaceId),
    queryFn: () => getBudgetsOverview(workspaceId),
    staleTime: 30 * 1000,
  });
}
