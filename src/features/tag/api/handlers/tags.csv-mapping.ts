import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  TagCsvFieldMappingSchema,
  TagCsvMappingValidationSchema,
} from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import {
  autoDetectTagMapping,
  validateTagMapping,
} from "../../services/tag-csv.service";

/**
 * POST /api/v1/tags/csv-mapping
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

      const mapping = autoDetectTagMapping(columns);
      const validatedMapping = TagCsvFieldMappingSchema.parse(mapping);

      return json(validatedMapping, { status: 200 });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/v1/tags/csv-mapping/validate
 * Validate mapping against required fields
 */
export async function validate({ request }: { request: Request }) {
  try {
    return await withAuth(async () => {
      const body = await request.json();
      const mapping = TagCsvFieldMappingSchema.parse(body.mapping);

      const validation = validateTagMapping(mapping);

      const response = TagCsvMappingValidationSchema.parse(validation);

      return json(response, { status: 200 });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
