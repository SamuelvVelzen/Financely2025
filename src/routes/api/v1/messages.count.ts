import { GET } from "@/features/message/api/handlers/messages.count";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/messages/count")({
  server: {
    handlers: {
      GET,
    },
  },
});
