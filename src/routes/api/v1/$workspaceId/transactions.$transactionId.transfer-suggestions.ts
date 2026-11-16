import { GET } from "@/features/transaction/api/handlers/transactions.$transactionId.transfer-suggestions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/$transactionId/transfer-suggestions",
)({
  server: {
    handlers: {
      GET,
    },
  },
});
