import {
  DELETE,
  PATCH,
} from "@/features/transaction/api/handlers/transactions.$transactionId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transactions/$transactionId")({
  component: () => null,
  server: {
    handlers: {
      PATCH,
      DELETE,
    },
  },
});
