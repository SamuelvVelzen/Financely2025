import {
  createSettlementPOST,
  listSettlementsGET,
} from "@/features/split/api/handlers/me-splits";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/me/splits/groups/$groupId/settlements",
)({
  server: {
    handlers: {
      GET: listSettlementsGET,
      POST: createSettlementPOST,
    },
  },
});
