import { guestCreateSettlementPOST } from "@/features/split/api/handlers/guest-splits";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/splits/guest/$token/settlements")({
  server: {
    handlers: {
      POST: guestCreateSettlementPOST,
    },
  },
});
