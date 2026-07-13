import {
  createExpensePOST,
  listExpensesGET,
} from "@/features/split/api/handlers/me-splits";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/me/splits/groups/$groupId/expenses",
)({
  server: {
    handlers: {
      GET: listExpensesGET,
      POST: createExpensePOST,
    },
  },
});
