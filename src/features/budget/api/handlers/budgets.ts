import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { BudgetsQuerySchema } from "@/features/shared/validation/schemas";
import { BudgetService } from "@/features/budget/services/budget.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/budgets
 * List budgets with optional filtering
 */
export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const url = new URL(request.url);
      const query = {
        from: url.searchParams.get("from") ?? undefined,
        to: url.searchParams.get("to") ?? undefined,
        q: url.searchParams.get("q") ?? undefined,
      };

      const validated = BudgetsQuerySchema.parse(query);
      const result = await BudgetService.listBudgets(userId, validated);
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/v1/budgets
 * Create a new budget
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const result = await BudgetService.createBudget(userId, body);

      return json(result, { status: 201 });
    });
  } catch (error) {
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

