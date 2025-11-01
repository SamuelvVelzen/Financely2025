import { ApiError, createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { withAuth } from "@/lib/auth/context";
import { TagService } from "@/lib/services/tag.service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tags/$tagId")({
  component: () => null,
});

/**
 * PATCH /api/tags/:id
 * Update a tag
 */
export async function PATCH(
  request: Request,
  { params }: { params: { tagId: string } }
) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const result = await TagService.updateTag(userId, params.tagId, body);
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
 * DELETE /api/tags/:id
 * Delete a tag
 */
export async function DELETE(
  request: Request,
  { params }: { params: { tagId: string } }
) {
  try {
    return await withAuth(async (userId) => {
      await TagService.deleteTag(userId, params.tagId);
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
