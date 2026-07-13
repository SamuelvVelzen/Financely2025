import {
  groupDELETE,
  groupGET,
  groupPATCH,
} from "@/features/split/api/handlers/me-splits";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/me/splits/groups/$groupId")({
  server: {
    handlers: {
      GET: groupGET,
      PATCH: groupPATCH,
      DELETE: groupDELETE,
    },
  },
});
