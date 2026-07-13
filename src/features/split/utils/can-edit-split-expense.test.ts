import { describe, expect, it } from "vitest";
import { canEditSplitExpense } from "./can-edit-split-expense";

describe("canEditSplitExpense", () => {
  const expense = {
    createdByUserId: "user-1",
    paidByMemberId: "member-1",
  };

  it("allows admins", () => {
    expect(
      canEditSplitExpense(expense, {
        userId: "user-2",
        memberId: "member-2",
        role: "admin",
      }),
    ).toBe(true);
  });

  it("allows the creator", () => {
    expect(
      canEditSplitExpense(expense, {
        userId: "user-1",
        memberId: "member-2",
        role: "member",
      }),
    ).toBe(true);
  });

  it("allows the payer", () => {
    expect(
      canEditSplitExpense(expense, {
        userId: "user-2",
        memberId: "member-1",
        role: "member",
      }),
    ).toBe(true);
  });

  it("denies unrelated members", () => {
    expect(
      canEditSplitExpense(expense, {
        userId: "user-2",
        memberId: "member-2",
        role: "member",
      }),
    ).toBe(false);
  });
});
