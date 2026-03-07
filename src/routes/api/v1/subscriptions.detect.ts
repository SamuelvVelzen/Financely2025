import { GET } from "@/features/subscription/api/handlers/subscriptions.detect";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/subscriptions/detect")({
  server: {
    handlers: {
      GET,
    },
  },
});
