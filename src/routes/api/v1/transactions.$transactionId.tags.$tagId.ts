import {
  DELETE,
  POST,
} from "@/features/transaction/api/handlers/transactions.$transactionId.tags.$tagId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/transactions/$transactionId/tags/$tagId"
)({
  component: () => null,
  server: {
    handlers: {
      POST,
      DELETE,
    },
  },
});

