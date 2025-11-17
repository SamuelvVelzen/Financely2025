import { POST } from "@/features/tag/api/handlers/tags.csv-mapping";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tags/csv-mapping")({
  server: {
    handlers: {
      POST,
    },
  },
});
