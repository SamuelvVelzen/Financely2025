import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { WorkspaceCurrencyService } from "@/features/currency/services/workspace-currency.service";
import { WorkspaceCurrenciesResponseSchema } from "@/features/currency/validation/schemas";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/:workspaceId/currencies
 * Distinct currencies used in transactions, budgets, and subscriptions
 */
export async function GET({
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const currencies = await WorkspaceCurrencyService.getWorkspaceCurrencies(
          userId,
          workspaceId,
        );
        return json(WorkspaceCurrenciesResponseSchema.parse({ currencies }));
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
