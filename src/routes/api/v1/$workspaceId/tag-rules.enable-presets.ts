import { POST } from "@/features/tag-rule/api/handlers/tag-rules.enable-presets";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/tag-rules/enable-presets",
)({
  server: {
    handlers: {
      POST,
    },
  },
});
