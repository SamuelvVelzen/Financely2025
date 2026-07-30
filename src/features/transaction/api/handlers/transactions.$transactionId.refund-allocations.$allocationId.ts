import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { json } from "@tanstack/react-start";
import { RefundAllocationService } from "../../services/refund-allocation.service";

/**
 * DELETE /api/v1/:workspaceId/transactions/:transactionId/refund-allocations/:allocationId
 * Remove a single refund allocation
 */
export async function DELETE({
  request: _request,
  params,
}: {
  request: Request;
  params: {
    workspaceId: string;
    transactionId: string;
    allocationId: string;
  };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const result = await RefundAllocationService.deleteAllocation(
          userId,
          workspaceId,
          params.transactionId,
          params.allocationId,
        );
        return json(result);
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Allocation not found" ||
        error.message === "Transaction not found")
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, error.message, 404),
      );
    }
    return createErrorResponse(error);
  }
}
