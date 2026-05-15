/**
 * BetterAuth Client
 *
 * Client-side authentication client for React components.
 * Provides hooks and methods for authentication operations.
 */

import { clearOfflineOutboxBeforeSignOut } from "@/features/shared/offline/clear-offline-outbox-on-sign-out";
import {
  inferAdditionalFields,
  magicLinkClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

// Get base URL from environment or use current origin
const getBaseURL = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    // Infer additional fields from server auth config
    inferAdditionalFields<typeof auth>(),
    // Magic link client plugin (if enabled)
    ...(process.env.ENABLE_MAGIC_LINK !== "false" ? [magicLinkClient()] : []),
  ],
});

export type ISignOutFromAppOptions = Parameters<typeof authClient.signOut>[0];

/**
 * Clears the offline mutation outbox for the current session, then signs out via Better Auth.
 * Accepts the same argument shape as {@link authClient.signOut}.
 */
export async function signOutFromApp(
  options?: ISignOutFromAppOptions,
): Promise<void> {
  await clearOfflineOutboxBeforeSignOut();
  await authClient.signOut(options);
}

// Export types for use in components
export type Session = typeof authClient.$Infer.Session;
