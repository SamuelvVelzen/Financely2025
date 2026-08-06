import { isSplitsAddonEnabled } from "@/features/split/addons/splits-addon";
import { SplitGroupPage } from "@/features/split/pages/split-group-page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/splits/$groupId/")({
  beforeLoad: () => {
    if (!isSplitsAddonEnabled()) {
      throw redirect({ to: "/" });
    }
  },
  component: SplitGroupPage,
  head: () => ({
    meta: [{ title: "Split group | Financely" }],
  }),
});
