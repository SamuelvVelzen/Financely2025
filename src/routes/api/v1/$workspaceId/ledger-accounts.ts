import { GET, POST } from "@/features/ledger-account/api/handlers/ledger-accounts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/ledger-accounts")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
