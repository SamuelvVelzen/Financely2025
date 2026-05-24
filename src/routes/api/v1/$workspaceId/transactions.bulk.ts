import { BULK_POLICY } from "@/features/shared/rate-limit/rate-limit-policies";
import { withWorkspaceRateLimit } from "@/features/shared/rate-limit/with-workspace-rate-limit";
import { POST } from "@/features/transaction/api/handlers/transactions.bulk";
import { createFileRoute } from "@tanstack/react-router";

const rateLimitedPost = withWorkspaceRateLimit(
  "tx-bulk",
  BULK_POLICY,
  POST,
);

export const Route = createFileRoute("/api/v1/$workspaceId/transactions/bulk")({
  server: {
    handlers: {
      POST: rateLimitedPost,
    },
  },
});
