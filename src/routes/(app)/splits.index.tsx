import { isSplitsAddonEnabled } from "@/features/split/addons/splits-addon";
import { SplitsPage } from "@/features/split/pages/splits-page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/splits/")({
  beforeLoad: () => {
    if (!isSplitsAddonEnabled()) {
      throw redirect({ to: "/" });
    }
  },
  component: SplitsPage,
  head: () => ({
    meta: [{ title: "Splits | Financely" }],
  }),
});
