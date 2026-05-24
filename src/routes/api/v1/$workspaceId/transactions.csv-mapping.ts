import { CSV_PIPELINE_POLICY } from "@/features/shared/rate-limit/rate-limit-policies";
import { withWorkspaceRateLimit } from "@/features/shared/rate-limit/with-workspace-rate-limit";
import { POST } from "@/features/transaction/api/handlers/transactions.csv-mapping";
import { createFileRoute } from "@tanstack/react-router";

const rateLimitedPost = withWorkspaceRateLimit(
  "tx-csv-mapping",
  CSV_PIPELINE_POLICY,
  POST,
);

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/csv-mapping"
)({
  server: {
    handlers: {
      POST: rateLimitedPost,
    },
  },
});
