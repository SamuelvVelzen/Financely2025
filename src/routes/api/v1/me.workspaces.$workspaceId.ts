import { DELETE, PATCH } from "@/features/users/api/handlers/me-workspaces.$workspaceId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/me/workspaces/$workspaceId")({
  server: {
    handlers: {
      PATCH,
      DELETE,
    },
  },
});
