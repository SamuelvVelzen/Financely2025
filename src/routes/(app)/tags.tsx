import { TagOverview } from "@/features/tag/components/tag-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/tags")({
  component: TagsPage,
  head: () => ({
    meta: [
      {
        title: "Tags | Financely  ",
      },
    ],
  }),
});

function TagsPage() {
  return <TagOverview />;
}
