import { DELETE } from "@/features/users/api/handlers/me-accounts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/me/accounts/$accountId")({
  server: {
    handlers: {
      DELETE,
    },
  },
});
