import { createRateLimitResponse } from "./create-rate-limit-response";
import { checkRateLimit, type IRateLimitPolicy } from "./rate-limit";

export function enforceRateLimit(
  key: string,
  policy: IRateLimitPolicy,
): Response | null {
  const result = checkRateLimit(key, policy);
  if (!result.allowed) {
    return createRateLimitResponse(result.retryAfterMs);
  }
  return null;
}
