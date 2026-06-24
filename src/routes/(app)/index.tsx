import { createFileRoute } from "@tanstack/react-router";
import { AppHomeRedirect } from "./app-home-redirect";

export const Route = createFileRoute("/(app)/")({
  component: AppHomeRedirect,
});
