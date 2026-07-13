import { describe, expect, it } from "vitest";
import {
  canDeleteSplitSettlement,
  canEditSplitSettlement,
} from "./can-edit-split-settlement";

describe("canEditSplitSettlement", () => {
  const settlement = {
    createdByUserId: "user-1",
    fromMemberId: "member-1",
    toMemberId: "member-2",
  };

  it("allows admins", () => {
    expect(
      canEditSplitSettlement(settlement, {
        userId: "user-2",
        memberId: "member-3",
        role: "admin",
      }),
    ).toBe(true);
  });

  it("allows the creator", () => {
    expect(
      canEditSplitSettlement(settlement, {
        userId: "user-1",
        memberId: "member-3",
        role: "member",
      }),
    ).toBe(true);
  });

  it("allows involved members", () => {
    expect(
      canEditSplitSettlement(settlement, {
        userId: "user-2",
        memberId: "member-2",
        role: "member",
      }),
    ).toBe(true);
  });

  it("denies unrelated members", () => {
    expect(
      canEditSplitSettlement(settlement, {
        userId: "user-2",
        memberId: "member-3",
        role: "member",
      }),
    ).toBe(false);
  });
});

describe("canDeleteSplitSettlement", () => {
  const recentCreatedAt = new Date().toISOString();

  it("allows admins", () => {
    expect(
      canDeleteSplitSettlement(
        { createdByUserId: "user-1", createdAt: recentCreatedAt },
        { userId: "user-2", role: "admin" },
      ),
    ).toBe(true);
  });

  it("allows creators within the edit window", () => {
    expect(
      canDeleteSplitSettlement(
        { createdByUserId: "user-1", createdAt: recentCreatedAt },
        { userId: "user-1", role: "member" },
      ),
    ).toBe(true);
  });

  it("denies creators after the edit window", () => {
    const oldCreatedAt = new Date(
      Date.now() - 25 * 60 * 60 * 1000,
    ).toISOString();

    expect(
      canDeleteSplitSettlement(
        { createdByUserId: "user-1", createdAt: oldCreatedAt },
        { userId: "user-1", role: "member" },
      ),
    ).toBe(false);
  });
});
