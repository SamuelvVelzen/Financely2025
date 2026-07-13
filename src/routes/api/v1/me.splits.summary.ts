import { summaryGET } from "@/features/split/api/handlers/me-splits";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/me/splits/summary")({
  server: {
    handlers: {
      GET: summaryGET,
    },
  },
});
