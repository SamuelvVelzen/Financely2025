import { GET } from "@/features/budget/api/handlers/budgets.overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/budgets/overview")({
  component: () => null,
  server: {
    handlers: {
      GET,
    },
  },
});

