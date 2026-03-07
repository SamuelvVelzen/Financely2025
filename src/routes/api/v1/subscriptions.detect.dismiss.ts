import { POST } from "@/features/subscription/api/handlers/subscriptions.detect.dismiss";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/v1/subscriptions/detect/dismiss",
)({
  server: {
    handlers: {
      POST,
    },
  },
});
