import { POST } from "@/features/transaction/api/handlers/transactions.bulk-delete";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/bulk-delete",
)({
  server: {
    handlers: {
      POST,
    },
  },
});