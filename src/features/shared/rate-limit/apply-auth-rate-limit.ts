import { createRateLimitResponse } from "./create-rate-limit-response";
import { getClientIp } from "./get-client-ip";
import { getAuthRateLimitPolicy } from "./rate-limit-policies";
import { checkRateLimit } from "./rate-limit";

/**
 * Returns a 429 response when the auth route is rate limited, otherwise null.
 */
export function applyAuthRateLimit(request: Request): Response | null {
  const policy = getAuthRateLimitPolicy(request);
  const path = new URL(request.url).pathname;
  const key = `auth:${request.method}:${getClientIp(request)}:${path}`;
  const result = checkRateLimit(key, policy);

  if (!result.allowed) {
    return createRateLimitResponse(result.retryAfterMs);
  }

  return null;
}
