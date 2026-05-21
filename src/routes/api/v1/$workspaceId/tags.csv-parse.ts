import { POST } from "@/features/tag/api/handlers/tags.csv-parse";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/tags/csv-parse")({
  server: {
    handlers: {
      POST,
    },
  },
});
