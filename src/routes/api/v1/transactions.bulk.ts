import { POST } from "@/features/transaction/api/handlers/transactions.bulk";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/transactions/bulk")({
  server: {
    handlers: {
      POST,
    },
  },
});

