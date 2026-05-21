import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { BulkCreateTransactionInputSchema } from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { TransactionService } from "../../services/transaction.service";

/**
 * POST /api/v1/:workspaceId/transactions/bulk
 * Bulk create transactions with partial success support
 */
export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const validated = BulkCreateTransactionInputSchema.parse(body);
        const result = await TransactionService.bulkCreateTransactions(
          userId,
          workspaceId,
          validated
        );

        if (result.errors.length === 0) {
          return json(result, { status: 201 });
        } else if (result.created.length === 0) {
          return createErrorResponse(
            new ApiError(
              ErrorCodes.VALIDATION_ERROR,
              "All transactions failed to create",
              400
            )
          );
        } else {
          return json(result, { status: 207 });
        }
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
