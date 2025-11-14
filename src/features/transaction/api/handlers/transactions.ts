import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TransactionsQuerySchema } from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { TransactionService } from "../../services/transaction.service";

/**
 * GET /api/transactions
 * List transactions with pagination, filtering, and sorting
 */
export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
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
      };

      const validated = TransactionsQuerySchema.parse(query);
      const result = await TransactionService.listTransactions(
        userId,
        validated
      );
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const result = await TransactionService.createTransaction(userId, body);
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
