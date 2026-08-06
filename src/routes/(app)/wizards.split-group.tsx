import { SplitGroupWizardPage } from "@/features/wizard/pages/split-group-wizard-page";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { isSplitsAddonEnabled } from "@/features/split/addons/splits-addon";
import { z } from "zod";

const searchSchema = z.object({
  step: z.string().optional(),
});

export const Route = createFileRoute("/(app)/wizards/split-group")({
  beforeLoad: () => {
    if (!isSplitsAddonEnabled()) {
      throw redirect({ to: "/splits" });
    }
  },
  component: SplitGroupWizardPage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {
        title: "New split group | Financely",
      },
    ],
  }),
});
