import { GET } from "@/features/notification/api/handlers/notifications.count";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/notifications/count")({
  server: {
    handlers: {
      GET,
    },
  },
});
