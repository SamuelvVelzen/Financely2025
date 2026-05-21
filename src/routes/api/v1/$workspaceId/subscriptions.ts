import { GET, POST } from "@/features/subscription/api/handlers/subscriptions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/subscriptions")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
