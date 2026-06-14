import {
  GET,
  PATCH,
} from "@/features/workspace/api/handlers/me-workspace-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/me/workspaces/$workspaceId/settings",
)({
  server: {
    handlers: {
      GET,
      PATCH,
    },
  },
});
