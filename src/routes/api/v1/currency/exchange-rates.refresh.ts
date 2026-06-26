import { POST } from "@/features/currency/api/handlers/exchange-rates.refresh";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/currency/exchange-rates/refresh",
)({
  server: {
    handlers: {
      POST,
    },
  },
});
