/**
 * BetterAuth API Route Handler
 *
 * Catch-all route handler for BetterAuth API endpoints.
 * Handles all requests to /api/auth/*
 */

import { applyAuthRateLimit } from "@/features/shared/rate-limit/apply-auth-rate-limit";
import { auth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";

function rateLimitedAuthHandler(request: Request): Response | Promise<Response> {
  const blocked = applyAuthRateLimit(request);
  if (blocked) {
    return blocked;
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
