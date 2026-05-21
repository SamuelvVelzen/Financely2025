import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TransactionService } from "../../services/transaction.service";

/**
 * PATCH /api/v1/:workspaceId/transactions/:transactionId
 * Update a transaction
 */
export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; transactionId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const result = await TransactionService.updateTransaction(
          userId,
          workspaceId,
          params.transactionId,
          body
        );
        return Response.json(result);
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Transaction not found", 404)
      );
    }
    if (
      error instanceof Error &&
      error.message === "One or more tags not found"
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "One or more tags not found", 404)
      );
    }
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/v1/:workspaceId/transactions/:transactionId
 * Delete a transaction
 */
export async function DELETE({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; transactionId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        await TransactionService.deleteTransaction(
          userId,
          workspaceId,
          params.transactionId
        );
        return Response.json({ success: true }, { status: 200 });
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Transaction not found", 404)
      );
    }
    return createErrorResponse(error);
  }
}
