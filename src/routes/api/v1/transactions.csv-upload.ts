import { POST } from "@/features/transaction/api/handlers/transactions.csv-upload";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/transactions/csv-upload")({
  server: {
    handlers: {
      POST,
    },
  },
});

