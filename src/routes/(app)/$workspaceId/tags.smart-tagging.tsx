import { createFileRoute } from "@tanstack/react-router";
import { SmartTaggingPage } from "@/features/tag-rule/pages/smart-tagging-page";

export const Route = createFileRoute("/(app)/$workspaceId/tags/smart-tagging")({
  component: SmartTaggingPage,
  head: () => ({
    meta: [
      {
        title: "Smart Tagging | Financely",
      },
    ],
  }),
});
