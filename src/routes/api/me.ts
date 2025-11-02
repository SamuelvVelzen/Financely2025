import { GET } from "@/features/users/api/handlers/me";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/me")({
  server: {
    handlers: {
      GET,
    },
  },
});
