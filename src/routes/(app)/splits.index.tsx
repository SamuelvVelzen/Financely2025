import { createFileRoute } from "@tanstack/react-router";
import { SplitsPage } from "@/features/split/pages/splits-page";

export const Route = createFileRoute("/(app)/splits/")({
  component: SplitsPage,
  head: () => ({
    meta: [{ title: "Splits | Financely" }],
  }),
});
