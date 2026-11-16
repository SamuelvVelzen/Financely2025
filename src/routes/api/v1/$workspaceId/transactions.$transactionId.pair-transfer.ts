import { POST } from "@/features/transaction/api/handlers/transactions.$transactionId.pair-transfer";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/$transactionId/pair-transfer",
)({
  server: {
    handlers: {
      POST,
    },
  },
});
