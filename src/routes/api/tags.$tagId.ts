import { DELETE, PATCH } from "@/features/tags/api/handlers/tags.$tagId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tags/$tagId")({
  component: () => null,
  server: {
    handlers: {
      PATCH,
      DELETE,
    },
  },
});
