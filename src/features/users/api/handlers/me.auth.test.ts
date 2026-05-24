import { UnauthorizedError } from "@/features/auth/errors";
import { ErrorCodes } from "@/features/shared/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/context", () => ({
  withAuth: vi.fn(),
}));

import * as authContext from "@/features/auth/context";
import { GET } from "./me";

describe("GET /api/v1/me auth", () => {
  beforeEach(() => {
    vi.mocked(authContext.withAuth).mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(authContext.withAuth).mockRejectedValue(new UnauthorizedError());

    const response = await GET({
      request: new Request("http://localhost/api/v1/me"),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });
});
