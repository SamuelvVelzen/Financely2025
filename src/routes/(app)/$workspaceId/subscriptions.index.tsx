import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionsPageRoute } from "@/features/subscription/pages/subscriptions-page-route";

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
