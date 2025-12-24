import { GET, POST } from "@/features/message/api/handlers/messages";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/messages")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});

