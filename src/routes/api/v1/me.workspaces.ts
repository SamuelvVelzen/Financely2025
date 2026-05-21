import { GET, POST } from "@/features/users/api/handlers/me-workspaces";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/me/workspaces")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
