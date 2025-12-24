import {
  DELETE,
  GET,
  PATCH,
} from "@/features/message/api/handlers/messages.$messageId";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/messages/$messageId")({
  server: {
    handlers: {
      GET,
      PATCH,
      DELETE,
    },
  },
});
