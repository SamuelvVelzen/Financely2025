import { ApiError, createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { withAuth } from "@/lib/auth/context";
import { TagService } from "@/lib/services/tag.service";
import { TagsQuerySchema } from "@/lib/validation/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

export const Route = createFileRoute("/api/tags")({
  server: {
    handlers: {
      /**
       * GET /api/tags
       * List tags with optional filtering and sorting
       */
      GET: async ({ request }) => {
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
          });
        } catch (error) {
          return createErrorResponse(error);
        }
      },
      /**
       * POST /api/tags
       * Create a new tag
       */
      POST: async ({ request }) => {
        try {
          return await withAuth(async (userId) => {
            const body = await request.json();
            const result = await TagService.createTag(userId, body);

            return json(result, { status: 201 });
          });
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
      },
    },
  },
});
