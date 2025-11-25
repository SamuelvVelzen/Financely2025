import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TagService } from "@/features/tag/services/tag.service";

/**
 * POST /api/v1/tags/reorder
 * Reorder tags by updating their order values
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      await TagService.reorderTags(userId, body);
      return Response.json({ success: true });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "One or more tags not found or do not belong to user"
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, error.message, 404)
      );
    }
    return createErrorResponse(error);
  }
}


