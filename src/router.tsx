import { RouteErrorFallback } from "@/features/ui/container/route-error-fallback";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultHashScrollIntoView: { behavior: "smooth" },
    defaultErrorComponent: RouteErrorFallback,
  });

  return router;
}
