import { POST } from "@/features/tag/api/handlers/tags.reorder";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/tags/reorder")({
  server: {
    handlers: {
      POST,
    },
  },
});
