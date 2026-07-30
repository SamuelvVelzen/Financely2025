import { parsePwaShortcutGo } from "@/features/shared/pwa/pwa-shortcut-destination";
import { AppHomeRedirect } from "@/features/workspace/pages/app-home-redirect";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
  validateSearch: (search: Record<string, unknown>) => {
    const go = parsePwaShortcutGo(search.go);

    return go ? { go } : {};
  },
  component: AppHomeRedirect,
});
