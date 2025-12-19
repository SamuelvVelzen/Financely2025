import { GET } from "@/features/users/api/handlers/me-accounts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/me/accounts")({
  server: {
    handlers: {
      GET,
    },
  },
});
