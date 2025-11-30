import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TagsQuerySchema } from "@/features/shared/validation/schemas";
import { TagService } from "@/features/tag/services/tag.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/tags
 * List tags with optional filtering and sorting
 */
export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const url = new URL(request.url);
      const query = {
        q: url.searchParams.get("q") ?? undefined,
        sort: (url.searchParams.get("sort") ?? "name:asc") as
          | "name:asc"
          | "name:desc",
      };

      const validated = TagsQuerySchema.parse(query);
      const result = await TagService.listTags(userId, validated);
      return json(result);
    }, request);
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/v1/tags
 * Create a new tag
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const result = await TagService.createTag(userId, body);

      return json(result, { status: 201 });
    }, request);
  } catch (error) {
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
