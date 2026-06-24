import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "./messages-page";

export const Route = createFileRoute("/(app)/$workspaceId/messages")({
  component: MessagesPage,
  head: () => ({
    meta: [
      {
        title: "Messages | Financely",
      },
    ],
  }),
});
