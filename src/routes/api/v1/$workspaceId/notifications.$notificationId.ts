import {
  DELETE,
  GET,
  PATCH,
} from "@/features/notification/api/handlers/notifications.$notificationId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/notifications/$notificationId",
)({
  server: {
    handlers: {
      GET,
      PATCH,
      DELETE,
    },
  },
});
