import { rotateGuestLinkPOST } from "@/features/split/api/handlers/me-splits";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/me/splits/groups/$groupId/guest-link/rotate",
)({
  server: {
    handlers: {
      POST: rotateGuestLinkPOST,
    },
  },
});
