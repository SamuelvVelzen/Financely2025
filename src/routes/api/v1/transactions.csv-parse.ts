import { POST } from "@/features/transaction/api/handlers/transactions.csv-parse";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/transactions/csv-parse")({
  server: {
    handlers: {
      POST,
    },
  },
});
