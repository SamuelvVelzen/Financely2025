import { createFileRoute } from "@tanstack/react-router";
import { AppHomeRedirect } from "@/features/workspace/pages/app-home-redirect";

export const Route = createFileRoute("/(app)/")({
  component: AppHomeRedirect,
});
