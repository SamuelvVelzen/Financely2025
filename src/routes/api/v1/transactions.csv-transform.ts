import { POST } from "@/features/transaction/api/handlers/transactions.csv-transform";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/transactions/csv-transform")({
  server: {
    handlers: {
      POST,
    },
  },
});
