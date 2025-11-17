import { POST } from "@/features/tag/api/handlers/tags.bulk";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tags/bulk")({
  server: {
    handlers: {
      POST,
    },
  },
});

