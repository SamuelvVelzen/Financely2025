import {
  GET,
  PATCH,
} from "@/features/ledger-account/api/handlers/ledger-accounts.$ledgerAccountId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/ledger-accounts/$ledgerAccountId",
)({
  server: {
    handlers: {
      GET,
      PATCH,
    },
  },
});
