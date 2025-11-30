/**
 * BetterAuth API Route Handler
 *
 * Catch-all route handler for BetterAuth API endpoints.
 * Handles all requests to /api/auth/*
 */

import { auth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return auth.handler(request);
      },
      POST: ({ request }) => {
        return auth.handler(request);
      },
    },
  },
});
