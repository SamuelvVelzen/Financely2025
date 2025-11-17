import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { BulkCreateTagInputSchema } from "@/features/shared/validation/schemas";
import { TagService } from "@/features/tag/services/tag.service";
import { json } from "@tanstack/react-start";

/**
 * POST /api/tags/bulk
 * Bulk create tags with partial success support
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const validated = BulkCreateTagInputSchema.parse(body);
      const result = await TagService.bulkCreateTags(userId, validated);

      // Determine status code based on results
      if (result.errors.length === 0) {
        // All items succeeded
        return json(result, { status: 201 });
      } else if (result.created.length === 0) {
        // All items failed
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "All tags failed to create",
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
