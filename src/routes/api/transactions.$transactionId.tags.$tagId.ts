import {
  DELETE,
  POST,
} from "@/features/transactions/api/handlers/transactions.$transactionId.tags.$tagId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/transactions/$transactionId/tags/$tagId"
)({
  component: () => null,
  server: {
    handlers: {
      POST,
      DELETE,
    },
  },
});
