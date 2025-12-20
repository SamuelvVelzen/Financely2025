/**
 * Authentication Configuration Helper
 *
 * Centralized helper to track which authentication methods are enabled.
 * Works on both server-side (Node.js) and client-side (browser).
 */

export type IAuthConfig = {
  emailPassword: boolean;
  magicLink: boolean;
  google: boolean;
  microsoft: boolean;
  apple: boolean;
};

/**
 * Get authentication configuration based on environment variables
 * Works on both server and client side
 */
export function getAuthConfig(): IAuthConfig {
  // Check if we're on the server (Node.js) or client (browser)
  const isServer = typeof window === "undefined";

  if (isServer) {
    // Server-side: use process.env
    return {
      emailPassword: process.env.ENABLE_EMAIL_PASSWORD !== "false",
      magicLink: process.env.ENABLE_MAGIC_LINK !== "false",
      google: process.env.ENABLE_GOOGLE === "true",
      microsoft: process.env.ENABLE_MICROSOFT === "true",
      apple: process.env.ENABLE_APPLE === "true",
    };
  } else {
    // Client-side: use import.meta.env (Vite)
    return {
      emailPassword: import.meta.env.VITE_ENABLE_EMAIL_PASSWORD !== "false",
      magicLink: import.meta.env.VITE_ENABLE_MAGIC_LINK !== "false",
      google: import.meta.env.VITE_ENABLE_GOOGLE === "true",
      microsoft: import.meta.env.VITE_ENABLE_MICROSOFT === "true",
      apple: import.meta.env.VITE_ENABLE_APPLE === "true",
    };
  }
}

/**
 * Get list of enabled social providers
 */
export function getEnabledSocialProviders(): Array<
  "google" | "microsoft" | "apple"
> {
  const config = getAuthConfig();
  const providers: Array<"google" | "microsoft" | "apple"> = [];

  if (config.apple) providers.push("apple");
  if (config.google) providers.push("google");
  if (config.microsoft) providers.push("microsoft");

  return providers;
}

/**
 * Check if a specific provider is enabled
 */
export function isProviderEnabled(
  provider: "google" | "microsoft" | "apple"
): boolean {
  const config = getAuthConfig();
  return config[provider];
}
