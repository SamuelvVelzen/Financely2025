import { DELETE, PATCH } from "@/features/tag/api/handlers/tags.$tagId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tags/$tagId")({
  component: () => null,
  server: {
    handlers: {
      PATCH,
      DELETE,
    },
  },
});

