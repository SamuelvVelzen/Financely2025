import { RouteErrorFallback } from "@/features/ui/container/route-error-fallback";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

export function WorkspaceRouteError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset: resetQueries }) => (
        <RouteErrorFallback
          error={error}
          reset={() => {
            resetQueries();
            reset();
          }}
        />
      )}
    </QueryErrorResetBoundary>
  );
}
