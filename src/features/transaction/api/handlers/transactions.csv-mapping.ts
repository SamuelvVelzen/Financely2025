import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  CsvFieldMappingSchema,
  CsvMappingValidationSchema,
} from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { SYSTEM_REQUIRED_FIELDS } from "../../config/transaction-fields";
import { autoDetectMapping, validateMapping } from "../../services/csv.service";
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
            propertyOrder: autoMapping.metadata.propertyOrder || null,
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

/**
 * POST /api/v1/transactions/csv/mapping/validate
 * Validate mapping against required fields
 */
export async function validate({ request }: { request: Request }) {
  try {
    return await withAuth(async () => {
      const body = await request.json();
      const mapping = CsvFieldMappingSchema.parse(body.mapping);
      const defaultType = body.defaultType as "EXPENSE" | "INCOME" | undefined;
      const typeDetectionStrategy = body.typeDetectionStrategy as
        | string
        | undefined;
      const defaultCurrency = body.defaultCurrency as
        | "USD"
        | "EUR"
        | "GBP"
        | "CAD"
        | "AUD"
        | "JPY"
        | undefined;

      // If type detection strategy is provided and defaultType is not, type field is optional
      // If defaultCurrency is provided, currency field is optional
      const validation = validateMapping(
        mapping,
        SYSTEM_REQUIRED_FIELDS,
        defaultType,
        !!typeDetectionStrategy && !defaultType,
        !!defaultCurrency
      );

      const response = CsvMappingValidationSchema.parse(validation);

      return json(response, { status: 200 });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
