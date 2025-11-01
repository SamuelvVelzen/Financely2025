import { ApiError, createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { withAuth } from "@/lib/auth/context";
import { TransactionService } from "@/lib/services/transaction.service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transactions/$transactionId")({
  component: () => null,
});

/**
 * PATCH /api/transactions/:id
 * Update a transaction
 */
export async function PATCH(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const result = await TransactionService.updateTransaction(
        userId,
        params.transactionId,
        body
      );
      return Response.json(result);
    });
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
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
export async function DELETE(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  try {
    return await withAuth(async (userId) => {
      await TransactionService.deleteTransaction(userId, params.transactionId);
      return Response.json({ success: true }, { status: 200 });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Transaction not found", 404)
      );
    }
    return createErrorResponse(error);
  }
}
