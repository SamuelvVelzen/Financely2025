import { GET, POST } from "@/features/transaction/api/handlers/transactions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transactions")({
  server: {
    handlers: {
      GET,
      POST,
    },
  },
});
