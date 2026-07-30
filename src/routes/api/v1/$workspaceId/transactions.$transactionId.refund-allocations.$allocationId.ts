import { DELETE } from "@/features/transaction/api/handlers/transactions.$transactionId.refund-allocations.$allocationId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/$transactionId/refund-allocations/$allocationId",
)({
  server: {
    handlers: {
      DELETE,
    },
  },
});
