import { GET, PUT } from "@/features/users/api/handlers/me-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/me/settings")({
  server: {
    handlers: {
      GET,
      PUT,
    },
  },
});
