import { validate } from "@/features/transaction/api/handlers/transactions.csv-mapping";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/transactions/csv-mapping/validate"
)({
  server: {
    handlers: {
      POST: validate,
    },
  },
});

