import {
  GET,
  PUT,
} from "@/features/wizard/api/handlers/wizard.$wizardId.progress";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/wizard/$wizardId/progress")({
  server: {
    handlers: {
      GET,
      PUT,
    },
  },
});
