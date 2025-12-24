import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  CsvImportRequestSchema,
  CsvImportResponseSchema,
} from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { TransactionService } from "../../services/transaction.service";
import { MessageFactory } from "@/features/message/services/message.factory";

/**
 * POST /api/v1/transactions/csv/import
 * Accept approved transactions, re-validate, call TransactionService.bulkCreateTransactions, return results
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const validated = CsvImportRequestSchema.parse(body);

      // Re-validate all transactions using the bulk create service
      // The service will handle validation and return errors for invalid items
      const result = await TransactionService.bulkCreateTransactions(
        userId,
        validated.transactions
      );

      const response = CsvImportResponseSchema.parse({
        successCount: result.created.length,
        failureCount: result.errors.length,
        errors: result.errors,
      });

      // Create message for import result (don't await, fire and forget)
      if (result.created.length > 0) {
        MessageFactory.createTransactionImportMessage(
          userId,
          result.created.length,
          result.errors.length
        ).catch((error) => {
          // Log error but don't fail the request
          console.error("Failed to create import message:", error);
        });
      }

      // Determine status code
      if (result.errors.length === 0) {
        return json(response, { status: 201 });
      } else if (result.created.length === 0) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "All transactions failed to import",
            400
          )
        );
      } else {
        // Partial success
        return json(response, { status: 207 });
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

