import { GET } from "@/features/tag-rule/api/handlers/tag-rules.discover";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/tag-rules/discover",
)({
  server: {
    handlers: {
      GET,
    },
  },
});
