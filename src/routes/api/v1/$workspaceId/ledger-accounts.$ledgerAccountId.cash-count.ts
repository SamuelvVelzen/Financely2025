import { POST } from "@/features/ledger-account/api/handlers/ledger-accounts.$ledgerAccountId.cash-count";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/ledger-accounts/$ledgerAccountId/cash-count",
)({
  server: {
    handlers: {
      POST,
    },
  },
});
