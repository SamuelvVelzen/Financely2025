import { cleanupTestUsers, createTestUser } from "@/test/db-helpers";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, ErrorCodes } from "@/features/shared/api/errors";
import {
  requireWorkspaceForUser,
  withWorkspaceAuth,
} from "./workspace-context";

vi.mock("./context", () => ({
  requireAuth: vi.fn(),
}));

import * as authContext from "./context";

describe("workspace isolation", () => {
  beforeEach(async () => {
    await cleanupTestUsers();
    vi.mocked(authContext.requireAuth).mockReset();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("allows access to the user's own workspace", async () => {
    const { user, workspace } = await createTestUser("owner");

    const result = await requireWorkspaceForUser(user.id, workspace.id);
    expect(result.id).toBe(workspace.id);
  });

  it("returns 404 when accessing another user's workspace", async () => {
    const owner = await createTestUser("owner-a");
    const other = await createTestUser("owner-b");

    await expect(
      requireWorkspaceForUser(other.user.id, owner.workspace.id),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ApiError &&
        error.statusCode === 404 &&
        error.code === ErrorCodes.NOT_FOUND
      );
    });
  });

  it("blocks withWorkspaceAuth for foreign workspace ids", async () => {
    const owner = await createTestUser("owner-c");
    const other = await createTestUser("owner-d");

    vi.mocked(authContext.requireAuth).mockResolvedValue(other.user.id);

    await expect(
      withWorkspaceAuth(String(owner.workspace.id), async () => "ok"),
    ).rejects.toSatisfy((error: unknown) => {
      return error instanceof ApiError && error.statusCode === 404;
    });
  });

  it("rejects invalid workspace id segments", async () => {
    const { user } = await createTestUser("owner-e");
    vi.mocked(authContext.requireAuth).mockResolvedValue(user.id);

    await expect(
      withWorkspaceAuth("not-a-number", async () => "ok"),
    ).rejects.toSatisfy((error: unknown) => {
      return error instanceof ApiError && error.statusCode === 404;
    });
  });
});
