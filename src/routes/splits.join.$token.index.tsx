import { SplitGuestJoinPage } from "@/features/split/pages/split-guest-join-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/splits/join/$token/")({
  component: SplitGuestJoinPage,
  head: () => ({
    meta: [{ title: "Join split group | Financely" }],
  }),
});
