import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { BudgetService } from "@/features/budget/services/budget.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/:workspaceId/budgets/overview
 * Get aggregated overview data for all active budgets
 */
export async function GET({
  request: _request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const result = await BudgetService.getBudgetsOverview(
          userId,
          workspaceId
        );
        return json(result);
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
