import { POST } from "@/features/transaction/api/handlers/transactions.bulk-update-type";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/bulk-update-type",
)({
  server: {
    handlers: {
      POST,
    },
  },
});
