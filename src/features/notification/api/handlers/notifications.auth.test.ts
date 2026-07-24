import { UnauthorizedError } from "@/features/auth/errors";
import { ErrorCodes } from "@/features/shared/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/context", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/features/notification/services/notification.service", () => ({
  NotificationService: {
    listNotifications: vi.fn(),
  },
}));

import * as authContext from "@/features/auth/context";
import { GET } from "./notifications";

describe("GET /api/v1/:workspaceId/notifications auth", () => {
  beforeEach(() => {
    vi.mocked(authContext.requireAuth).mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(authContext.requireAuth).mockRejectedValue(
      new UnauthorizedError(),
    );

    const response = await GET({
      request: new Request("http://localhost/api/v1/1/notifications"),
      params: { workspaceId: "1" },
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });
});
