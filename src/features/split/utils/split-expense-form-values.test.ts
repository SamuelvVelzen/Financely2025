import { describe, expect, it } from "vitest";
import {
  getFormValuesForAnotherExpense,
  getSplitExpenseFormValuesFromExpense,
} from "./split-expense-form-values";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";

const sampleExpense: ISplitExpense = {
  id: "exp-1",
  description: "Taxi",
  amount: "24.50",
  currency: "MXN",
  groupAmount: "1.20",
  conversionStatus: "converted",
  expenseDate: "2026-07-01T12:00:00.000Z",
  splitMode: "equal",
  paidByMemberId: "member-1",
  paidByDisplayName: "Sam",
  createdByUserId: "user-1",
  clientMutationId: null,
  shares: [
    {
      id: "share-1",
      memberId: "member-1",
      displayName: "Sam",
      shareAmount: "12.25",
      shareGroupAmount: "0.60",
      status: "active",
    },
    {
      id: "share-2",
      memberId: "member-2",
      displayName: "Alex",
      shareAmount: "12.25",
      shareGroupAmount: "0.60",
      status: "active",
    },
  ],
  createdAt: "2026-07-01T12:00:00.000Z",
};

describe("split expense form values", () => {
  it("maps an expense into editable form values", () => {
    expect(getSplitExpenseFormValuesFromExpense(sampleExpense)).toEqual({
      description: "Taxi",
      amount: "24.50",
      currency: "MXN",
      expenseDate: "2026-07-01T12:00:00.000Z",
      paidByMemberId: "member-1",
      participantMemberIds: ["member-1", "member-2"],
      splitMode: "equal",
      shareInputs: {},
    });
  });

  it("maps exact-split expenses with share amounts", () => {
    expect(
      getSplitExpenseFormValuesFromExpense({
        ...sampleExpense,
        splitMode: "exact",
        shares: [
          { ...sampleExpense.shares[0]!, shareAmount: "20.00" },
          { ...sampleExpense.shares[1]!, shareAmount: "4.50" },
        ],
      }),
    ).toEqual({
      description: "Taxi",
      amount: "24.50",
      currency: "MXN",
      expenseDate: "2026-07-01T12:00:00.000Z",
      paidByMemberId: "member-1",
      participantMemberIds: ["member-1", "member-2"],
      splitMode: "exact",
      shareInputs: {
        "member-1": "20.00",
        "member-2": "4.50",
      },
    });
  });

  it("keeps split settings when adding another expense", () => {
    const submitted = getSplitExpenseFormValuesFromExpense(sampleExpense);
    expect(
      getFormValuesForAnotherExpense(submitted, "EUR", [
        "member-1",
        "member-2",
      ]),
    ).toEqual({
      description: "",
      amount: "",
      currency: "MXN",
      expenseDate: "2026-07-01T12:00:00.000Z",
      paidByMemberId: "member-1",
      participantMemberIds: ["member-1", "member-2"],
      splitMode: "equal",
      shareInputs: {},
    });
  });
});
