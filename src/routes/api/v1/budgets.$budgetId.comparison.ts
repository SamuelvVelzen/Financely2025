import { GET } from "@/features/budget/api/handlers/budget.$budgetId.comparison";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/budgets/$budgetId/comparison")({
  component: () => null,
  server: {
    handlers: {
      GET,
    },
  },
});
