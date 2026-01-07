import { withAuth } from "@/features/auth/context";
import { MessageFactory } from "@/features/message/services/message.factory";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  CsvImportRequestSchema,
  CsvImportResponseSchema,
  type ICreateTransactionInput,
} from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { parsePrimaryTag, parseTags } from "../../services/csv.service";
import { TransactionService } from "../../services/transaction.service";

/**
 * Check if a string is a valid CUID (tag ID format)
 */
function isTagId(value: string): boolean {
  // CUIDs are typically 25 characters, alphanumeric
  return /^[a-z0-9]{25}$/.test(value);
}

/**
 * Resolve tag names to tagIds for a transaction
 */
async function resolveTransactionTags(
  transaction: ICreateTransactionInput,
  userId: string
): Promise<ICreateTransactionInput> {
  const resolved = { ...transaction };

  // Resolve tagIds if they contain tag names
  if (transaction.tagIds && transaction.tagIds.length > 0) {
    const tagNames: string[] = [];
    const existingTagIds: string[] = [];

    // Separate tag names from tag IDs
    for (const item of transaction.tagIds) {
      if (isTagId(item)) {
        existingTagIds.push(item);
      } else {
        tagNames.push(item);
      }
    }

    // Resolve tag names to IDs
    if (tagNames.length > 0 && transaction.type) {
      try {
        const resolvedTagIds = await parseTags(
          tagNames.join(","),
          userId,
          transaction.type
        );
        resolved.tagIds = [...existingTagIds, ...resolvedTagIds];
      } catch (error) {
        // If tag resolution fails, keep existing tagIds and log error
        console.error("Failed to resolve tag names:", error);
        resolved.tagIds = existingTagIds;
      }
    } else {
      resolved.tagIds = existingTagIds;
    }
  }

  // Resolve primaryTagId if it's a tag name
  if (transaction.primaryTagId && !isTagId(transaction.primaryTagId)) {
    if (transaction.type) {
      try {
        resolved.primaryTagId = await parsePrimaryTag(
          transaction.primaryTagId,
          userId,
          transaction.type
        );
      } catch (error) {
        // If tag resolution fails, set to null and log error
        console.error("Failed to resolve primary tag name:", error);
        resolved.primaryTagId = null;
      }
    } else {
      resolved.primaryTagId = null;
    }
  }

  return resolved;
}

/**
 * POST /api/v1/transactions/csv/import
 * Accept approved transactions, re-validate, call TransactionService.bulkCreateTransactions, return results
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const validated = CsvImportRequestSchema.parse(body);

      // Resolve tag names to tagIds before importing
      const transactionsWithResolvedTags = await Promise.all(
        validated.transactions.map((transaction) =>
          resolveTransactionTags(transaction, userId)
        )
      );

      // Re-validate all transactions using the bulk create service
      // The service will handle validation and return errors for invalid items
      const result = await TransactionService.bulkCreateTransactions(
        userId,
        transactionsWithResolvedTags
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
