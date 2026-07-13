import { guestGroupGET } from "@/features/split/api/handlers/guest-splits";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/splits/guest/$token")({
  server: {
    handlers: {
      GET: guestGroupGET,
    },
  },
});
