import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "@/features/shared/api/client";
import type {
  IBudget,
  IBudgetComparison,
  IBudgetsQuery,
  IBudgetsResponse,
  ICreateBudgetInput,
  IUpdateBudgetInput,
} from "@/features/shared/validation/schemas";

/**
 * Budget API Client
 * Client-side functions for interacting with budget endpoints
 */

export async function getBudgets(
  query?: IBudgetsQuery
): Promise<IBudgetsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<IBudgetsResponse>(`/budgets${queryString}`);
}

export async function getBudget(budgetId: string): Promise<IBudget> {
  return apiGet<IBudget>(`/budgets/${budgetId}`);
}

export async function createBudget(
  input: ICreateBudgetInput
): Promise<IBudget> {
  return apiPost<IBudget>("/budgets", input);
}

export async function updateBudget(
  budgetId: string,
  input: IUpdateBudgetInput
): Promise<IBudget> {
  return apiPatch<IBudget>(`/budgets/${budgetId}`, input);
}

export async function deleteBudget(
  budgetId: string
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/budgets/${budgetId}`);
}

export async function getBudgetComparison(
  budgetId: string
): Promise<IBudgetComparison> {
  return apiGet<IBudgetComparison>(`/budgets/${budgetId}/comparison`);
}

