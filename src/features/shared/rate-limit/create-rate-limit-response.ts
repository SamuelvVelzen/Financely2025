import { ErrorResponseSchema } from "@/features/shared/validation/schemas";

export const RATE_LIMIT_ERROR_CODE = "RATE_LIMITED";

export function createRateLimitResponse(retryAfterMs: number): Response {
  const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));

  return Response.json(
    ErrorResponseSchema.parse({
      error: {
        code: RATE_LIMIT_ERROR_CODE,
        message: "Too many requests. Please try again later.",
      },
    }),
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
