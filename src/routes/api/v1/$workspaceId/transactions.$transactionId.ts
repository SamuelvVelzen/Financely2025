import {
  DELETE,
  GET,
  PATCH,
} from "@/features/transaction/api/handlers/transactions.$transactionId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/$workspaceId/transactions/$transactionId"
)({
  server: {
    handlers: {
      GET,
      PATCH,
      DELETE,
    },
  },
});
