import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TransactionService } from "@/features/transactions/services/transaction.service";

/**
 * POST /api/transactions/:id/tags/:tagId
 * Add a tag to a transaction
 */
export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { transactionId: string; tagId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const result = await TransactionService.addTagToTransaction(
        userId,
        params.transactionId,
        params.tagId
      );
      return Response.json(result, { status: 200 });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Transaction not found" ||
        error.message === "Tag not found")
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, error.message, 404)
      );
    }
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/transactions/:id/tags/:tagId
 * Remove a tag from a transaction
 */
export async function DELETE({
  request,
  params,
}: {
  request: Request;
  params: { transactionId: string; tagId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const result = await TransactionService.removeTagFromTransaction(
        userId,
        params.transactionId,
        params.tagId
      );
      return Response.json(result, { status: 200 });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Transaction not found" ||
        error.message === "Tag not found")
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, error.message, 404)
      );
    }
    return createErrorResponse(error);
  }
}
