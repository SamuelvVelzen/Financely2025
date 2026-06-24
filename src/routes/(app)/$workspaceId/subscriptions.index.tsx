import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionsPageRoute } from "./subscriptions-page";

export const Route = createFileRoute("/(app)/$workspaceId/subscriptions/")({
  component: SubscriptionsPageRoute,
  head: () => ({
    meta: [
      {
        title: "Subscriptions | Financely",
      },
    ],
  }),
});
