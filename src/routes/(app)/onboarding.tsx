import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OnboardingPage } from "@/features/wizard/pages/onboarding-page";

const searchSchema = z.object({
  step: z.string().optional(),
});

export const Route = createFileRoute("/(app)/onboarding")({
  component: OnboardingPage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {
        title: "Welcome | Financely",
      },
    ],
  }),
});
