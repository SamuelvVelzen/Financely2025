import { UnauthorizedError } from "@/features/auth/errors";
import { describe, expect, it } from "vitest";
import { ApiError, createErrorResponse, ErrorCodes } from "./errors";

describe("createErrorResponse", () => {
  it("maps UnauthorizedError to HTTP 401", async () => {
    const response = createErrorResponse(new UnauthorizedError());
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it("maps legacy Unauthorized message to HTTP 401", async () => {
    const response = createErrorResponse(new Error("Unauthorized"));
    expect(response.status).toBe(401);
  });

  it("maps ApiError to its status code", async () => {
    const response = createErrorResponse(
      new ApiError(ErrorCodes.NOT_FOUND, "Workspace not found", 404),
    );
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.NOT_FOUND);
  });

  it("maps unknown errors to HTTP 500", async () => {
    const response = createErrorResponse(new Error("boom"));
    expect(response.status).toBe(500);
  });
});
