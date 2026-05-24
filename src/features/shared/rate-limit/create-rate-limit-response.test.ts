import { describe, expect, it } from "vitest";
import {
  createRateLimitResponse,
  RATE_LIMIT_ERROR_CODE,
} from "./create-rate-limit-response";

describe("createRateLimitResponse", () => {
  it("returns HTTP 429 with Retry-After", async () => {
    const response = createRateLimitResponse(5000);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("5");

    const body = await response.json();
    expect(body.error.code).toBe(RATE_LIMIT_ERROR_CODE);
  });
});
