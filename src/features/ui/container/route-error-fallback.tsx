import { QueryErrorState } from "@/features/ui/container/query-error-state";
import { Link } from "@tanstack/react-router";

export type IRouteErrorFallbackProps = {
  error: Error;
  reset: () => void;
};

/**
 * TanStack Router errorComponent / defaultErrorComponent fallback.
 * Catches errors thrown during route render, loaders, and beforeLoad.
 */
export function RouteErrorFallback({ error, reset }: IRouteErrorFallbackProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 px-4">
      <QueryErrorState
        title="Something went wrong"
        message={error.message || "An unexpected error occurred."}
        onRetry={reset}
        retryLabel="Try again"
      />
      <Link
        to="/"
        className="text-sm text-text-muted underline-offset-4 hover:underline">
        Go to home
      </Link>
    </div>
  );
}
