import { describe, expect, it } from "vitest";
import {
  formatViewerExpenseNetAmount,
  getViewerExpenseNetAmount,
} from "./get-viewer-expense-net-amount";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";

const baseExpense: ISplitExpense = {
  id: "e1",
  description: "Dinner",
  amount: "100.00",
  currency: "USD",
  groupAmount: "100.00",
  conversionStatus: "converted",
  expenseDate: "2026-01-01T00:00:00.000Z",
  splitMode: "equal",
  addToTransactions: false,
  paidByMemberId: "alice",
  paidByDisplayName: "Alice",
  createdByUserId: "u1",
  clientMutationId: null,
  shares: [
    {
      id: "s1",
      memberId: "alice",
      displayName: "Alice",
      shareAmount: "50.00",
      shareGroupAmount: "50.00",
      status: "active",
      addToTransactions: false,
    },
    {
      id: "s2",
      memberId: "bob",
      displayName: "Bob",
      shareAmount: "50.00",
      shareGroupAmount: "50.00",
      status: "active",
      addToTransactions: false,
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("getViewerExpenseNetAmount", () => {
  it("returns amount owed to payer after their share", () => {
    expect(getViewerExpenseNetAmount(baseExpense, "alice", "USD")).toBe(50);
  });

  it("returns negative amount when viewer owes their share", () => {
    expect(getViewerExpenseNetAmount(baseExpense, "bob", "USD")).toBe(-50);
  });

  it("returns null when viewer is not involved", () => {
    expect(getViewerExpenseNetAmount(baseExpense, "carol", "USD")).toBeNull();
  });

  it("returns null when group amount is unavailable", () => {
    const pending = {
      ...baseExpense,
      currency: "EUR",
      groupAmount: null,
      shares: baseExpense.shares.map((share) => ({
        ...share,
        shareGroupAmount: null,
      })),
    };
    expect(getViewerExpenseNetAmount(pending, "bob", "USD")).toBeNull();
  });
});

describe("formatViewerExpenseNetAmount", () => {
  it("prefixes positive amounts with plus", () => {
    expect(formatViewerExpenseNetAmount(50, "USD")).toMatch(/^\+/);
  });

  it("prefixes negative amounts with minus", () => {
    expect(formatViewerExpenseNetAmount(-50, "USD")).toMatch(/^-/);
  });
});
