/**
 * BetterAuth Client
 * 
 * Client-side authentication client for React components.
 * Provides hooks and methods for authentication operations.
 */

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

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
    // Magic link client plugin (if enabled)
    ...(process.env.ENABLE_MAGIC_LINK !== "false" ? [magicLinkClient()] : []),
  ],
});

// Export types for use in components
export type { Session, User } from "better-auth/types";


