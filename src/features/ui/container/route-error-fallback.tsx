import { QueryErrorState } from "@/features/ui/container/query-error-state";

export type IRouteErrorFallbackProps = {
  error: Error;
  reset: () => void;
};

function isRecoverableClientMismatch(error: Error): boolean {
  const message = error.message ?? "";
  return (
    message.includes("Failed to fetch") ||
    message.includes("HTTPError") ||
    message.includes("Server function info not found") ||
    message.includes('"status":500') ||
    /Loading chunk \d+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message)
  );
}

function getErrorMessage(error: Error): string {
  if (isRecoverableClientMismatch(error)) {
    return "This page is out of date or could not reach the server. Reload to continue.";
  }
  return error.message || "An unexpected error occurred.";
}

/**
 * TanStack Router errorComponent / defaultErrorComponent fallback.
 * Catches errors thrown during route render, loaders, and beforeLoad.
 */
export function RouteErrorFallback({ error, reset }: IRouteErrorFallbackProps) {
  const shouldHardRecover = isRecoverableClientMismatch(error);

  const handleRetry = () => {
    if (shouldHardRecover) {
      window.location.reload();
      return;
    }
    reset();
  };

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 px-4">
      <QueryErrorState
        title="Something went wrong"
        message={getErrorMessage(error)}
        onRetry={handleRetry}
        retryLabel={shouldHardRecover ? "Reload" : "Try again"}
      />
      {/* Hard navigation avoids keeping a stale client bundle in memory. */}
      <a
        href="/"
        className="text-sm text-text-muted underline-offset-4 hover:underline">
        Go to home
      </a>
    </div>
  );
}
