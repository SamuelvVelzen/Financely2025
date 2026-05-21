import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TagService } from "@/features/tag/services/tag.service";

/**
 * PATCH /api/v1/:workspaceId/tags/:tagId
 */
export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; tagId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const body = await request.json();
      const result = await TagService.updateTag(
        userId,
        workspaceId,
        params.tagId,
        body
      );
      return Response.json(result);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Tag not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Tag not found", 404)
      );
    }
    if (
      error instanceof Error &&
      error.message === "Tag with this name already exists"
    ) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.CONFLICT,
          "Tag with this name already exists",
          409
        )
      );
    }
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/v1/:workspaceId/tags/:tagId
 */
export async function DELETE({
  params,
}: {
  request: Request;
  params: { workspaceId: string; tagId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      await TagService.deleteTag(userId, workspaceId, params.tagId);
      return Response.json({ success: true }, { status: 200 });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Tag not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Tag not found", 404)
      );
    }
    return createErrorResponse(error);
  }
}
