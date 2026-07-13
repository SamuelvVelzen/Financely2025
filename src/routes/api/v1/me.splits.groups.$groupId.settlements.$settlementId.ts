import {
  deleteSettlementDELETE,
  updateSettlementPATCH,
} from "@/features/split/api/handlers/me-splits";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/me/splits/groups/$groupId/settlements/$settlementId",
)({
  server: {
    handlers: {
      PATCH: updateSettlementPATCH,
      DELETE: deleteSettlementDELETE,
    },
  },
});
