import { GET, POST } from "@/features/tag/api/handlers/tags";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tags")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
