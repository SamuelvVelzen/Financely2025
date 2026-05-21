import { DELETE, POST } from "@/features/transaction/api/handlers/transactions.$transactionId.tags.$tagId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/$transactionId/tags/$tagId"
)({
  server: {
    handlers: {
      POST,
      DELETE,
    },
  },
});
