import { DELETE, GET, PATCH } from "@/features/budget/api/handlers/budget.$budgetId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/$workspaceId/budgets/$budgetId")({
  server: {
    handlers: {
      GET,
      PATCH,
      DELETE,
    },
  },
});
