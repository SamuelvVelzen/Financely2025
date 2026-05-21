import { DELETE, PATCH } from "@/features/tag/api/handlers/tags.$tagId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/tags/$tagId")({
  server: {
    handlers: {
      PATCH,
      DELETE,
    },
  },
});
