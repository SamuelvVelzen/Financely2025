/**
 * BetterAuth API Route Handler
 *
 * Catch-all route handler for BetterAuth API endpoints.
 * Handles all requests to /api/auth/*
 */

import { createRateLimitResponse } from "@/features/shared/rate-limit/create-rate-limit-response";
import { getClientIp } from "@/features/shared/rate-limit/get-client-ip";
import { getAuthRateLimitPolicy } from "@/features/shared/rate-limit/rate-limit-policies";
import { checkRateLimit } from "@/features/shared/rate-limit/rate-limit";
import { auth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";

function rateLimitedAuthHandler(request: Request): Response | Promise<Response> {
  const policy = getAuthRateLimitPolicy(request);
  const path = new URL(request.url).pathname;
  const key = `auth:${request.method}:${getClientIp(request)}:${path}`;
  const result = checkRateLimit(key, policy);

  if (!result.allowed) {
    return createRateLimitResponse(result.retryAfterMs);
  }

  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => rateLimitedAuthHandler(request),
      POST: ({ request }) => rateLimitedAuthHandler(request),
    },
  },
});
