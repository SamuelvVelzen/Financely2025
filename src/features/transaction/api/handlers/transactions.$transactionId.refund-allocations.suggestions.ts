import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { json } from "@tanstack/react-start";
import { RefundAllocationService } from "../../services/refund-allocation.service";

/**
 * GET /api/v1/:workspaceId/transactions/:transactionId/refund-allocations/suggestions
 * Suggest expenses to allocate a refund against
 */
export async function GET({
  request: _request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; transactionId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const result = await RefundAllocationService.getSuggestions(
          userId,
          workspaceId,
          params.transactionId,
        );
        return json(result);
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Transaction not found", 404),
      );
    }
    if (
      error instanceof Error &&
      (error.message === "Refund suggestions require an income transaction" ||
        error.message ===
          "Refund suggestions require an income or expense transaction")
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, error.message, 400),
      );
    }
    return createErrorResponse(error);
  }
}
