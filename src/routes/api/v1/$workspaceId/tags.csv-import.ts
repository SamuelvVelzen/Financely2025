import { BULK_POLICY } from "@/features/shared/rate-limit/rate-limit-policies";
import { withWorkspaceRateLimit } from "@/features/shared/rate-limit/with-workspace-rate-limit";
import { POST } from "@/features/tag/api/handlers/tags.csv-import";
import { createFileRoute } from "@tanstack/react-router";

const rateLimitedPost = withWorkspaceRateLimit(
  "tag-csv-import",
  BULK_POLICY,
  POST,
);

export const Route = createFileRoute("/api/v1/$workspaceId/tags/csv-import")({
  server: {
    handlers: {
      POST: rateLimitedPost,
    },
  },
});
