import { POST } from "@/features/notification/api/handlers/notifications.read-all";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/notifications/read-all",
)({
  server: {
    handlers: {
      POST,
    },
  },
});
