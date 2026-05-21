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
  IBudgetsOverviewResponse,
  IBudgetsQuery,
  IBudgetsResponse,
  ICreateBudgetInput,
  IUpdateBudgetInput,
} from "@/features/shared/validation/schemas";
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export async function getBudgets(
  workspaceId: IWorkspaceId,
  query?: IBudgetsQuery,
): Promise<IBudgetsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<IBudgetsResponse>(
    `${workspaceApiV1Path(workspaceId, "budgets")}${queryString}`,
  );
}

export async function getBudget(
  workspaceId: IWorkspaceId,
  budgetId: string,
): Promise<IBudget> {
  return apiGet<IBudget>(
    workspaceApiV1Path(workspaceId, `budgets/${budgetId}`),
  );
}

export async function createBudget(
  workspaceId: IWorkspaceId,
  input: ICreateBudgetInput,
): Promise<IBudget> {
  return apiPost<IBudget>(workspaceApiV1Path(workspaceId, "budgets"), input);
}

export async function updateBudget(
  workspaceId: IWorkspaceId,
  budgetId: string,
  input: IUpdateBudgetInput,
): Promise<IBudget> {
  return apiPatch<IBudget>(
    workspaceApiV1Path(workspaceId, `budgets/${budgetId}`),
    input,
  );
}

export async function deleteBudget(
  workspaceId: IWorkspaceId,
  budgetId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, `budgets/${budgetId}`),
  );
}

export async function getBudgetComparison(
  workspaceId: IWorkspaceId,
  budgetId: string,
): Promise<IBudgetComparison> {
  return apiGet<IBudgetComparison>(
    workspaceApiV1Path(workspaceId, `budgets/${budgetId}/comparison`),
  );
}

export async function getBudgetsOverview(
  workspaceId: IWorkspaceId,
): Promise<IBudgetsOverviewResponse> {
  return apiGet<IBudgetsOverviewResponse>(
    workspaceApiV1Path(workspaceId, "budgets/overview"),
  );
}
