import { SplitGuestViewPage } from "@/features/split/pages/split-guest-view-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/splits/join/$token/view")({
  component: SplitGuestViewPage,
  head: () => ({
    meta: [{ title: "Split group | Financely" }],
  }),
});
