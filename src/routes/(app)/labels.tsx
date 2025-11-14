import { TagOverview } from "@/features/tag/components/tag-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/labels")({
  component: LabelsPage,
});

export function LabelsPage() {
  return <TagOverview />;
}
