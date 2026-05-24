import {
  UPLOAD_POLICY,
} from "@/features/shared/rate-limit/rate-limit-policies";
import { withWorkspaceRateLimit } from "@/features/shared/rate-limit/with-workspace-rate-limit";
import { POST } from "@/features/transaction/api/handlers/transactions.csv-upload";
import { createFileRoute } from "@tanstack/react-router";

const rateLimitedPost = withWorkspaceRateLimit(
  "tx-csv-upload",
  UPLOAD_POLICY,
  POST,
);

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/csv-upload"
)({
  server: {
    handlers: {
      POST: rateLimitedPost,
    },
  },
});
