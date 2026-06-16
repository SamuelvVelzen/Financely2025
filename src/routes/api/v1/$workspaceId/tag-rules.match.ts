import { POST } from "@/features/tag-rule/api/handlers/tag-rules.match";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/tag-rules/match",
)({
  server: {
    handlers: {
      POST,
    },
  },
});
