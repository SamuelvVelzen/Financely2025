import { GET } from "@/features/currency/api/handlers/exchange-rates";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/currency/exchange-rates")({
  server: {
    handlers: {
      GET,
    },
  },
});
