import { POST } from "@/features/transaction/api/handlers/transfers";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/transfers")({
  server: {
    handlers: {
      POST,
    },
  },
});
