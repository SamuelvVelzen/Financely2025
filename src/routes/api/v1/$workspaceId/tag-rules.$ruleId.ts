import { DELETE, PATCH } from "@/features/tag-rule/api/handlers/tag-rules.$ruleId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/tag-rules/$ruleId")({
  server: {
    handlers: {
      PATCH,
      DELETE,
    },
  },
});
