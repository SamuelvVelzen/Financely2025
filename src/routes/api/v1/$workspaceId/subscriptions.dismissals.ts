import { GET } from "@/features/subscription/api/handlers/subscriptions.dismissals";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/subscriptions/dismissals"
)({
  server: {
    handlers: {
      GET,
    },
  },
});
