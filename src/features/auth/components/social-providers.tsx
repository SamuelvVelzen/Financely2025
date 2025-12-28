/**
 * Social Providers Component
 *
 * Presentational component for social OAuth authentication providers.
 * Receives enabled providers and click handler as props.
 */

import { Button } from "@/features/ui/button/button";

export type ISocialProvider = "google" | "microsoft" | "apple";

interface ISocialProvidersProps {
  enabledProviders: {
    google?: boolean;
    microsoft?: boolean;
    apple?: boolean;
  };
  onProviderClick: (provider: ISocialProvider) => void;
  loading: boolean;
}

export function SocialProviders({
  enabledProviders,
  onProviderClick,
  loading,
}: ISocialProvidersProps) {
  const hasAnyProvider =
    enabledProviders.google ||
    enabledProviders.microsoft ||
    enabledProviders.apple;

  if (!hasAnyProvider) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-text-muted">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {enabledProviders.google && (
          <Button
            variant="default"
            clicked={() => onProviderClick("google")}
            disabled={loading}
            className="w-full">
            Continue with Google
          </Button>
        )}
        {enabledProviders.microsoft && (
          <Button
            variant="default"
            clicked={() => onProviderClick("microsoft")}
            disabled={loading}
            className="w-full">
            Continue with Microsoft
          </Button>
        )}
        {enabledProviders.apple && (
          <Button
            variant="default"
            clicked={() => onProviderClick("apple")}
            disabled={loading}
            className="w-full">
            Continue with Apple
          </Button>
        )}
      </div>
    </div>
  );
}
