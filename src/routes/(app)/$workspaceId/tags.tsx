import { tagFilterQuerySchema } from "@/features/tag/utils/tag-filter-query-schema";
import { createFileRoute } from "@tanstack/react-router";
import { TagsPage } from "./tags-page";

export const Route = createFileRoute("/(app)/$workspaceId/tags")({
  component: TagsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const validated = tagFilterQuerySchema.parse(search);
    return validated;
  },
  head: () => ({
    meta: [
      {
        title: "Tags | Financely",
      },
    ],
  }),
});
