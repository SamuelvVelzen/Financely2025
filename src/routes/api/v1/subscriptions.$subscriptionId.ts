import {
  DELETE,
  GET,
  PATCH,
} from "@/features/subscription/api/handlers/subscriptions.$subscriptionId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/subscriptions/$subscriptionId",
)({
  component: () => null,
  server: {
    handlers: {
      GET,
      PATCH,
      DELETE,
    },
  },
});
