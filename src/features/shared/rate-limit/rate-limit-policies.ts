import type { IRateLimitPolicy } from "./rate-limit";

/** Sign-in, sign-up, password reset, magic link, verification email. */
export const AUTH_SENSITIVE_POLICY: IRateLimitPolicy = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

/** Other Better Auth POST endpoints. */
export const AUTH_DEFAULT_POLICY: IRateLimitPolicy = {
  limit: 30,
  windowMs: 15 * 60 * 1000,
};

/** Better Auth GET (session checks, etc.). */
export const AUTH_READ_POLICY: IRateLimitPolicy = {
  limit: 120,
  windowMs: 60 * 1000,
};

/** CSV file uploads. */
export const UPLOAD_POLICY: IRateLimitPolicy = {
  limit: 15,
  windowMs: 60 * 60 * 1000,
};

/** Bulk create / CSV import commits. */
export const BULK_POLICY: IRateLimitPolicy = {
  limit: 10,
  windowMs: 60 * 60 * 1000,
};

/** CSV parse, mapping, transform steps. */
export const CSV_PIPELINE_POLICY: IRateLimitPolicy = {
  limit: 40,
  windowMs: 60 * 60 * 1000,
};

const SENSITIVE_AUTH_PATH_PARTS = [
  "sign-in",
  "sign-up",
  "forget-password",
  "reset-password",
  "magic-link",
  "send-verification",
  "verify-email",
] as const;

export function getAuthRateLimitPolicy(
  request: Request,
): IRateLimitPolicy {
  if (request.method === "GET") {
    return AUTH_READ_POLICY;
  }

  const path = new URL(request.url).pathname.toLowerCase();
  const isSensitive = SENSITIVE_AUTH_PATH_PARTS.some((part) =>
    path.includes(part),
  );

  return isSensitive ? AUTH_SENSITIVE_POLICY : AUTH_DEFAULT_POLICY;
}
