import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { BudgetService } from "@/features/budget/services/budget.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/budgets/overview
 * Get aggregated overview data for all active budgets
 */
export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const result = await BudgetService.getBudgetsOverview(userId);
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

