import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  ReplaceExpenseRefundAllocationsInputSchema,
  ReplaceRefundAllocationsInputSchema,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import { json } from "@tanstack/react-start";
import { RefundAllocationService } from "../../services/refund-allocation.service";

/**
 * PUT /api/v1/:workspaceId/transactions/:transactionId/refund-allocations
 * Replace allocations for an income (→ expenses) or expense (→ refunds) transaction
 */
export async function PUT({
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
        const existing = await prisma.transaction.findFirst({
          where: { id: params.transactionId, userId, workspaceId },
          select: { type: true },
        });
        if (!existing) {
          throw new Error("Transaction not found");
        }

        const body = await request.json();

        if (existing.type === "INCOME") {
          const input = ReplaceRefundAllocationsInputSchema.parse(body);
          const result = await RefundAllocationService.replaceAllocations(
            userId,
            workspaceId,
            params.transactionId,
            input,
          );
          return json(result);
        }

        if (existing.type === "EXPENSE") {
          const input = ReplaceExpenseRefundAllocationsInputSchema.parse(body);
          const result = await RefundAllocationService.replaceExpenseAllocations(
            userId,
            workspaceId,
            params.transactionId,
            input,
          );
          return json(result);
        }

        throw new Error("Refund allocations require an income or expense transaction");
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
      (error.message === "Refund allocations require an income transaction" ||
        error.message ===
          "Expense refund allocations require an expense transaction" ||
        error.message ===
          "Refund allocations require an income or expense transaction" ||
        error.message === "Duplicate expense allocations are not allowed" ||
        error.message === "Duplicate refund allocations are not allowed" ||
        error.message === "Allocation amount must be greater than zero" ||
        error.message === "Allocations exceed refund amount" ||
        error.message === "Allocations exceed expense amount" ||
        error.message === "One or more expense transactions not found" ||
        error.message === "One or more refund transactions not found" ||
        error.message === "Allocations must target expense transactions" ||
        error.message === "Allocations must target income transactions" ||
        error.message === "Refund and expense currencies must match" ||
        error.message.startsWith("Allocations exceed expense amount") ||
        error.message.startsWith("Allocations exceed refund amount"))
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, error.message, 400),
      );
    }
    return createErrorResponse(error);
  }
}
