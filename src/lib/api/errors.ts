import { ErrorResponseSchema } from "@/lib/validation/schemas";
import { z } from "zod";

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON() {
    return ErrorResponseSchema.parse({
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    });
  }
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/**
 * Create error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = "An error occurred"
): Response {
  if (error instanceof ApiError) {
    return Response.json(error.toJSON(), { status: error.statusCode });
  }

  if (error instanceof z.ZodError) {
    return Response.json(
      ErrorResponseSchema.parse({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: "Validation failed",
          details: {
            issues: error.issues,
          },
        },
      }),
      { status: 400 }
    );
  }

  // Unknown error
  return Response.json(
    ErrorResponseSchema.parse({
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : defaultMessage,
      },
    }),
    { status: 500 }
  );
}
