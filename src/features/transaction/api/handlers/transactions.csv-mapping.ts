import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { CsvFieldMappingSchema } from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { autoDetectMapping } from "../../services/csv.service";
import { BankSchema } from "../../validation/transaction.schema";

/**
 * POST /api/v1/transactions/csv/mapping
 * Auto-detect and return field mapping suggestions
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async () => {
      const body = await request.json();
      const { columns, bank: rawBank } = body;

      if (!Array.isArray(columns) || columns.length === 0) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "Columns array is required",
            400
          )
        );
      }

      const bank = rawBank ? BankSchema.parse(rawBank) : undefined;
      const autoMapping = autoDetectMapping(columns, bank);
      const validatedMapping = CsvFieldMappingSchema.parse(autoMapping.mapping);

      return json(
        {
          mapping: validatedMapping,
          metadata: {
            bank: autoMapping.metadata.bank || null,
          },
        },
        { status: 200 }
      );
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
