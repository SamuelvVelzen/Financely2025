import {
  createBudget,
  deleteBudget,
  getBudget,
  getBudgetComparison,
  getBudgets,
  getBudgetsOverview,
  updateBudget,
} from "@/features/budget/api/client";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
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

/**
 * Query budgets list
 * - staleTime: 2 minutes (medium, keeps UI snappy)
 * - Supports filtering by date range
 */
export function useBudgets(query?: IBudgetsQuery) {
  return useFinQuery<IBudgetsResponse, Error>({
    queryKey: queryKeys.budgets(query),
    queryFn: () => getBudgets(query),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Query single budget
 * - staleTime: 2 minutes
 */
export function useBudget(budgetId: string) {
  return useFinQuery<IBudget, Error>({
    queryKey: queryKeys.budget(budgetId),
    queryFn: () => getBudget(budgetId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...(budgetId ? {} : { enabled: false }),
  });
}

/**
 * Query budget comparison
 * - staleTime: 30 seconds (frequently changing data)
 */
export function useBudgetComparison(budgetId: string) {
  return useFinQuery<IBudgetComparison, Error>({
    queryKey: queryKeys.budgetComparison(budgetId),
    queryFn: () => getBudgetComparison(budgetId),
    staleTime: 30 * 1000, // 30 seconds
    ...(budgetId ? {} : { enabled: false }),
  });
}

/**
 * Create budget mutation
 * - Invalidates budgets query and overview on success
 */
export function useCreateBudget() {
  return useFinMutation<IBudget, Error, ICreateBudgetInput>({
    mutationFn: createBudget,
    invalidateQueries: [
      () => queryKeys.budgets(),
      () => queryKeys.budgetsOverview(),
    ],
  });
}

/**
 * Update budget mutation
 * - Invalidates budgets query, specific budget query, and overview on success
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useFinMutation<
    IBudget,
    Error,
    { budgetId: string; input: IUpdateBudgetInput }
  >({
    mutationFn: ({ budgetId, input }) => updateBudget(budgetId, input),
    invalidateQueries: [
      () => queryKeys.budgets(),
      () => queryKeys.budgetsOverview(),
    ],
    onSuccess: async (data, variables) => {
      // Invalidate the specific budget query using budgetId from variables
      queryClient.invalidateQueries({
        queryKey: queryKeys.budget(variables.budgetId),
      });
    },
  });
}

/**
 * Delete budget mutation
 * - Invalidates budgets query and overview on success
 */
export function useDeleteBudget() {
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteBudget,
    invalidateQueries: [
      () => queryKeys.budgets(),
      () => queryKeys.budgetsOverview(),
    ],
  });
}

/**
 * Query budgets overview (aggregated metrics for active budgets)
 * - staleTime: 30 seconds (frequently changing data, like comparison)
 */
export function useBudgetsOverview() {
  return useFinQuery<IBudgetsOverviewResponse, Error>({
    queryKey: queryKeys.budgetsOverview(),
    queryFn: () => getBudgetsOverview(),
    staleTime: 30 * 1000, // 30 seconds
  });
}
