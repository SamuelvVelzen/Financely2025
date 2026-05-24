import {
  cleanupTestUsers,
  createTestUser,
} from "@/test/db-helpers";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/features/util/prisma";
import { WorkspaceService } from "./workspace.service";

describe("WorkspaceService integration", () => {
  beforeEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("ensureAtLeastOneWorkspace creates a Personal workspace when missing", async () => {
    const userInfo = await prisma.userInfo.create({
      data: {
        email: `no-ws@test.financely.local`,
        emailVerified: true,
        firstName: "No",
        lastName: "Workspace",
      },
    });

    const user = await prisma.user.create({
      data: { userInfoId: userInfo.id },
    });

    await WorkspaceService.ensureAtLeastOneWorkspace(user.id);

    const workspaces = await WorkspaceService.listForUser(user.id);
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]?.name).toBe("Personal");
  });

  it("listForUser only returns workspaces owned by that user", async () => {
    const alice = await createTestUser("alice");
    const bob = await createTestUser("bob");

    const aliceWorkspaces = await WorkspaceService.listForUser(alice.user.id);
    const bobWorkspaces = await WorkspaceService.listForUser(bob.user.id);

    expect(aliceWorkspaces.some((w) => w.id === alice.workspace.id)).toBe(true);
    expect(aliceWorkspaces.some((w) => w.id === bob.workspace.id)).toBe(false);
    expect(bobWorkspaces.some((w) => w.id === bob.workspace.id)).toBe(true);
  });
});
