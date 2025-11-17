import { POST } from "@/features/transaction/api/handlers/transactions.csv-import";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/transactions/csv-import")({
  server: {
    handlers: {
      POST,
    },
  },
});
