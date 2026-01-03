import { TagOverview } from "@/features/tag/components/tag-overview";
import { tagFilterQuerySchema } from "@/features/tag/utils/tag-filter-query-schema";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/tags")({
  component: TagsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const validated = tagFilterQuerySchema.parse(search);
    return validated;
  },
  head: () => ({
    meta: [
      {
        title: "Tags | Financely  ",
      },
    ],
  }),
});

function TagsPage() {
  const search = Route.useSearch();
  const initialSearchQuery = search.q ?? "";
  return <TagOverview initialSearchQuery={initialSearchQuery} />;
}
