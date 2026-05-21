import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TransactionsQuerySchema } from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { TransactionService } from "../../services/transaction.service";

/**
 * GET /api/v1/:workspaceId/transactions
 * List transactions with pagination, filtering, and sorting
 */
export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const url = new URL(request.url);
      const query = {
        page: url.searchParams.get("page") ?? undefined,
        limit: url.searchParams.get("limit") ?? undefined,
        from: url.searchParams.get("from") ?? undefined,
        to: url.searchParams.get("to") ?? undefined,
        type: url.searchParams.get("type") ?? undefined,
        tagIds: url.searchParams.get("tagIds")
          ? url.searchParams.getAll("tagIds")
          : undefined,
        q: url.searchParams.get("q") ?? undefined,
        sort: url.searchParams.get("sort") ?? undefined,
        minAmount: url.searchParams.get("minAmount") ?? undefined,
        maxAmount: url.searchParams.get("maxAmount") ?? undefined,
        paymentMethod: url.searchParams.get("paymentMethod")
          ? url.searchParams.getAll("paymentMethod")
          : undefined,
        currency: url.searchParams.get("currency")
          ? url.searchParams.getAll("currency")
          : undefined,
      };

      const validated = TransactionsQuerySchema.parse(query);
      const result = await TransactionService.listTransactions(
        userId,
        workspaceId,
        validated
      );
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/v1/:workspaceId/transactions
 * Create a new transaction
 */
export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const body = await request.json();
      const result = await TransactionService.createTransaction(
        userId,
        workspaceId,
        body
      );
      return json(result, { status: 201 });
    });
  } catch (error) {
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
