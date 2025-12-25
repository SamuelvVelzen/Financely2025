import { GET, POST } from "@/features/budget/api/handlers/budgets";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/budgets")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
