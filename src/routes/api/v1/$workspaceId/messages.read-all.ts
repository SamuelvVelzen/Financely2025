import { POST } from "@/features/message/api/handlers/messages.read-all";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/messages/read-all")({
  server: {
    handlers: {
      POST,
    },
  },
});
