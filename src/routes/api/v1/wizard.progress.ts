import { GET } from "@/features/wizard/api/handlers/wizard.progress";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/wizard/progress")({
  server: {
    handlers: {
      GET,
    },
  },
});
