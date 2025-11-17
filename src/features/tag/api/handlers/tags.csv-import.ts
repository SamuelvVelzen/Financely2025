import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  TagCsvImportRequestSchema,
  TagCsvImportResponseSchema,
} from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { TagService } from "../../services/tag.service";

/**
 * POST /api/v1/tags/csv-import
 * Accept approved tags, re-validate, call TagService.bulkCreateTags, return results
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const validated = TagCsvImportRequestSchema.parse(body);

      // Re-validate all tags using the bulk create service
      const result = await TagService.bulkCreateTags(
        userId,
        validated.tags
      );

      const response = TagCsvImportResponseSchema.parse({
        successCount: result.created.length,
        failureCount: result.errors.length,
        errors: result.errors,
      });

      // Determine status code
      if (result.errors.length === 0) {
        return json(response, { status: 201 });
      } else if (result.created.length === 0) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "All tags failed to import",
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

