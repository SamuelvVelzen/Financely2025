import { GET } from "@/features/tag-rule/api/handlers/tag-rules.presets";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/tag-rules/presets",
)({
  server: {
    handlers: {
      GET,
    },
  },
});
