import { GET, POST } from "@/features/transaction/api/handlers/transactions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/transactions")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
