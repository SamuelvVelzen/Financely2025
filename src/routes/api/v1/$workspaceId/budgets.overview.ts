import { GET } from "@/features/budget/api/handlers/budgets.overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/budgets/overview")({
  server: {
    handlers: {
      GET,
    },
  },
});
