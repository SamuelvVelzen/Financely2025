import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { BulkCreateTransactionInputSchema } from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { TransactionService } from "../../services/transaction.service";

/**
 * POST /api/transactions/bulk
 * Bulk create transactions with partial success support
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const validated = BulkCreateTransactionInputSchema.parse(body);
      const result = await TransactionService.bulkCreateTransactions(
        userId,
        validated
      );

      // Determine status code based on results
      if (result.errors.length === 0) {
        // All items succeeded
        return json(result, { status: 201 });
      } else if (result.created.length === 0) {
        // All items failed
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "All transactions failed to create",
            400
          )
        );
      } else {
        // Partial success
        return json(result, { status: 207 });
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

