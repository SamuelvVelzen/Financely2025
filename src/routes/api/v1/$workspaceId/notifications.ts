import { GET, POST } from "@/features/notification/api/handlers/notifications";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/notifications")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
