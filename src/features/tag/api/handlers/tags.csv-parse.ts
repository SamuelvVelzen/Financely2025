import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  TagCsvFieldMappingSchema,
  TagCsvParseRequestSchema,
  TagCsvParseResponseSchema,
} from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import {
  convertRowsToTagCandidates,
  MAX_ROWS,
  parseCsvRows,
} from "../../services/tag-csv.service";

/**
 * POST /api/v1/tags/csv-parse
 * Parse CSV rows using mapping, return paginated candidate tags with validation errors
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async () => {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const mappingJson = formData.get("mapping") as string | null;

      if (!file) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "No file provided",
            400
          )
        );
      }

      if (!mappingJson) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "Mapping is required",
            400
          )
        );
      }

      const mapping = TagCsvFieldMappingSchema.parse(JSON.parse(mappingJson));
      const page = parseInt(formData.get("page") as string) || 1;
      const limit = parseInt(formData.get("limit") as string) || 50;

      const parseRequest = TagCsvParseRequestSchema.parse({
        mapping,
        page,
        limit,
      });

      // Parse rows
      const { rows, total } = await parseCsvRows(
        file,
        parseRequest.mapping,
        parseRequest.page,
        parseRequest.limit
      );

      // Check row count limit
      if (total > MAX_ROWS) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            `Too many rows. Maximum is ${MAX_ROWS} rows per import.`,
            400
          )
        );
      }

      // Convert to candidates
      const candidates = convertRowsToTagCandidates(
        rows,
        parseRequest.mapping
      );

      // Calculate stats
      const totalValid = candidates.filter((c) => c.status === "valid").length;
      const totalInvalid = candidates.filter((c) => c.status === "invalid")
        .length;

      const response = TagCsvParseResponseSchema.parse({
        candidates,
        page: parseRequest.page,
        limit: parseRequest.limit,
        total,
        totalValid,
        totalInvalid,
        hasNext: parseRequest.page * parseRequest.limit < total,
      });

      return json(response, { status: 200 });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

