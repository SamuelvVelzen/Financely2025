import { GET } from "@/features/users/api/handlers/me-profile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/me/profile")({
  server: {
    handlers: {
      GET,
    },
  },
});
