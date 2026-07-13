import { SplitGroupPage } from "@/features/split/pages/split-group-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/splits/$groupId/")({
  component: SplitGroupPage,
  head: () => ({
    meta: [{ title: "Split group | Financely" }],
  }),
});
