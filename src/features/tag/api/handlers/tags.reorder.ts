import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TagService } from "@/features/tag/services/tag.service";

/**
 * POST /api/v1/:workspaceId/tags/reorder
 */
export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const body = await request.json();
      await TagService.reorderTags(userId, workspaceId, body);
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
