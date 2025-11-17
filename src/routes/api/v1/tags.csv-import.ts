import { POST } from "@/features/tag/api/handlers/tags.csv-import";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tags/csv-import")({
  server: {
    handlers: {
      POST,
    },
  },
});
