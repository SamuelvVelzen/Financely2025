import { DELETE } from "@/features/subscription/api/handlers/subscriptions.dismissals.$dismissalId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/subscriptions/dismissals/$dismissalId"
)({
  server: {
    handlers: {
      DELETE,
    },
  },
});
