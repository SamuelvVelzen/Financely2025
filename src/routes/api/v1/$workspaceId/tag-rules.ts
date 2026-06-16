import { GET, POST } from "@/features/tag-rule/api/handlers/tag-rules";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/tag-rules")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
