import { MAIN_CONTENT_ID } from "@/features/shared/pages/app-layout";
import { RouteErrorFallback } from "@/features/ui/container/route-error-fallback";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    scrollToTopSelectors: [`#${MAIN_CONTENT_ID}`],
    defaultHashScrollIntoView: { behavior: "smooth" },
    defaultErrorComponent: RouteErrorFallback,
  });

  return router;
}
