import { POST } from "@/features/wizard/api/handlers/wizard.$wizardId.complete";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/wizard/$wizardId/complete")({
  server: {
    handlers: {
      POST,
    },
  },
});
