import { GET, POST } from "@/features/transactions/api/handlers/transactions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transactions")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
