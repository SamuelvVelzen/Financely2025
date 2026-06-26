import { GET } from "@/features/currency/api/handlers/workspace-currencies";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/currencies")({
  server: {
    handlers: {
      GET,
    },
  },
});
