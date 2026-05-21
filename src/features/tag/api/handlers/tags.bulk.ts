import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { BulkCreateTagInputSchema } from "@/features/shared/validation/schemas";
import { TagService } from "@/features/tag/services/tag.service";
import { json } from "@tanstack/react-start";

/**
 * POST /api/v1/:workspaceId/tags/bulk
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
      const validated = BulkCreateTagInputSchema.parse(body);
      const result = await TagService.bulkCreateTags(userId, workspaceId, validated);

      if (result.errors.length === 0) {
        return json(result, { status: 201 });
      } else if (result.created.length === 0) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "All tags failed to create",
            400
          )
        );
      } else {
        return json(result, { status: 207 });
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
