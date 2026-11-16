import { GET } from "@/features/transaction/api/handlers/trip-summary";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/trip-summary")({
  server: {
    handlers: {
      GET,
    },
  },
});
