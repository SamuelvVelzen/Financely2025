import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { BudgetService } from "@/features/budget/services/budget.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/budgets/:budgetId/comparison
 * Get budget comparison (actual vs expected)
 */
export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { budgetId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const result = await BudgetService.getBudgetComparison(
        userId,
        params.budgetId
      );
      return json(result);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Budget not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Budget not found", 404)
      );
    }
    return createErrorResponse(error);
  }
}

