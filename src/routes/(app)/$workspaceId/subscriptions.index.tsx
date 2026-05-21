import { SubscriptionsPage } from "@/features/subscription/components/subscriptions-page";
import { createFileRoute } from "@tanstack/react-router";

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

export function SubscriptionsPageRoute() {
  return <SubscriptionsPage />;
}
