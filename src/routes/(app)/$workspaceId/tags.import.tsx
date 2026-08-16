import { TagImportPage } from "@/features/tag/pages/tag-import-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/$workspaceId/tags/import")({
  component: TagImportPage,
  head: () => ({
    meta: [
      {
        title: "Import tags | Financely",
      },
    ],
  }),
});
