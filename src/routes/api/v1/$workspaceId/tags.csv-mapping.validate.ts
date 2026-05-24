import { CSV_PIPELINE_POLICY } from "@/features/shared/rate-limit/rate-limit-policies";
import { withWorkspaceRateLimit } from "@/features/shared/rate-limit/with-workspace-rate-limit";
import { validate } from "@/features/tag/api/handlers/tags.csv-mapping";
import { createFileRoute } from "@tanstack/react-router";

const rateLimitedValidate = withWorkspaceRateLimit(
  "tag-csv-mapping-validate",
  CSV_PIPELINE_POLICY,
  validate,
);

export const Route = createFileRoute(
  "/api/v1/$workspaceId/tags/csv-mapping/validate"
)({
  server: {
    handlers: {
      POST: rateLimitedValidate,
    },
  },
});
