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
import {
  autoDetectMapping,
  validateMapping,
} from "../../services/csv.service";
import { SYSTEM_REQUIRED_FIELDS } from "../../config/transaction-fields";

/**
 * POST /api/v1/transactions/csv/mapping
 * Auto-detect and return field mapping suggestions
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async () => {
      const body = await request.json();
      const { columns } = body;

      if (!Array.isArray(columns) || columns.length === 0) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "Columns array is required",
            400
          )
        );
      }

      const mapping = autoDetectMapping(columns);
      const validatedMapping = CsvFieldMappingSchema.parse(mapping);

      return json(validatedMapping, { status: 200 });
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
      const typeDetectionStrategy = body.typeDetectionStrategy as string | undefined;
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

