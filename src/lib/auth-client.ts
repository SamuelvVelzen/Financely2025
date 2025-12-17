/**
 * BetterAuth Client
 *
 * Client-side authentication client for React components.
 * Provides hooks and methods for authentication operations.
 */

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

// Export types for use in components
export type Session = typeof authClient.$Infer.Session;
