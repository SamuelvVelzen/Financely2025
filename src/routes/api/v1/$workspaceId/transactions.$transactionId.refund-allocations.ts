import { PUT } from "@/features/transaction/api/handlers/transactions.$transactionId.refund-allocations";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/$transactionId/refund-allocations",
)({
  server: {
    handlers: {
      PUT,
    },
  },
});
