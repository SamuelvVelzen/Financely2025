import { TagOverview } from "@/features/tag/components/tag-overview";
import { useSearch } from "@tanstack/react-router";

export function TagsPage() {
  const search = useSearch({ from: "/(app)/$workspaceId/tags/" });
  const initialSearchQuery = search.q ?? "";
  return <TagOverview initialSearchQuery={initialSearchQuery} />;
}
