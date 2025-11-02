import { GET, POST } from "@/features/tags/api/handlers/tags";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tags")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
