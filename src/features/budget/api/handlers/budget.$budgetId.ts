import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { BudgetService } from "@/features/budget/services/budget.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/budgets/:budgetId
 * Get a single budget
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
      const result = await BudgetService.getBudgetById(userId, params.budgetId);
      if (!result) {
        return createErrorResponse(
          new ApiError(ErrorCodes.NOT_FOUND, "Budget not found", 404)
        );
      }
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PATCH /api/v1/budgets/:budgetId
 * Update a budget
 */
export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { budgetId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const result = await BudgetService.updateBudget(
        userId,
        params.budgetId,
        body
      );
      return json(result);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Budget not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Budget not found", 404)
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("One or more tags do not belong to user")
    ) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          "One or more tags do not belong to user",
          400
        )
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("Duplicate tag entry")
    ) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.CONFLICT,
          error.message,
          409
        )
      );
    }
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/v1/budgets/:budgetId
 * Delete a budget
 */
export async function DELETE({
  request,
  params,
}: {
  request: Request;
  params: { budgetId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      await BudgetService.deleteBudget(userId, params.budgetId);
      return json({ success: true }, { status: 200 });
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

