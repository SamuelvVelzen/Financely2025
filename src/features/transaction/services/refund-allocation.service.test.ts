import {
  cleanupTestUsers,
  createTestTransaction,
  createTestUser,
} from "@/test/db-helpers";
import { TransactionType } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { RefundAllocationService } from "./refund-allocation.service";

describe("RefundAllocationService", () => {
  beforeEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("allocates a refund across multiple expenses with remaining", async () => {
    const owner = await createTestUser("refund-multi");
    const refund = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Store refund",
      { type: TransactionType.INCOME, amount: 50 },
    );
    const expenseA = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Groceries",
      { type: TransactionType.EXPENSE, amount: 40 },
    );
    const expenseB = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Snacks",
      { type: TransactionType.EXPENSE, amount: 20 },
    );

    const result = await RefundAllocationService.replaceAllocations(
      owner.user.id,
      owner.workspace.id,
      refund.id,
      {
        allocations: [
          { expenseTransactionId: expenseA.id, amount: "30" },
          { expenseTransactionId: expenseB.id, amount: "20" },
        ],
      },
    );

    expect(result.refundRemaining).toBe("0");
    expect(result.refundAllocations).toHaveLength(2);

    const suggestions = await RefundAllocationService.getSuggestions(
      owner.user.id,
      owner.workspace.id,
      refund.id,
    );
    expect(suggestions.refundRemaining).toBe("0");
    expect(
      suggestions.suggestions.find((s) => s.id === expenseA.id)?.expenseNet,
    ).toBe("10");
  });

  it("rejects allocations that exceed refund or expense amount", async () => {
    const owner = await createTestUser("refund-caps");
    const refund = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Refund",
      { type: TransactionType.INCOME, amount: 10 },
    );
    const expense = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Expense",
      { type: TransactionType.EXPENSE, amount: 5 },
    );

    await expect(
      RefundAllocationService.replaceAllocations(
        owner.user.id,
        owner.workspace.id,
        refund.id,
        {
          allocations: [
            { expenseTransactionId: expense.id, amount: "15" },
          ],
        },
      ),
    ).rejects.toThrow("Allocations exceed refund amount");

    await expect(
      RefundAllocationService.replaceAllocations(
        owner.user.id,
        owner.workspace.id,
        refund.id,
        {
          allocations: [
            { expenseTransactionId: expense.id, amount: "8" },
          ],
        },
      ),
    ).rejects.toThrow('Allocations exceed expense amount');
  });

  it("rejects wrong types, currencies, and cross-workspace links", async () => {
    const owner = await createTestUser("refund-validate");
    const other = await createTestUser("refund-other");
    const refund = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Refund",
      { type: TransactionType.INCOME, amount: 20 },
    );
    const expense = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Expense",
      { type: TransactionType.EXPENSE, amount: 20 },
    );
    const incomeAsTarget = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Other income",
      { type: TransactionType.INCOME, amount: 20 },
    );
    const usdExpense = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "USD expense",
      { type: TransactionType.EXPENSE, amount: 20, currency: "USD" },
    );
    const otherExpense = await createTestTransaction(
      other.user.id,
      other.workspace.id,
      "Other workspace",
      { type: TransactionType.EXPENSE, amount: 20 },
    );

    await expect(
      RefundAllocationService.replaceAllocations(
        owner.user.id,
        owner.workspace.id,
        expense.id,
        {
          allocations: [
            { expenseTransactionId: expense.id, amount: "5" },
          ],
        },
      ),
    ).rejects.toThrow("Refund allocations require an income transaction");

    await expect(
      RefundAllocationService.replaceAllocations(
        owner.user.id,
        owner.workspace.id,
        refund.id,
        {
          allocations: [
            { expenseTransactionId: incomeAsTarget.id, amount: "5" },
          ],
        },
      ),
    ).rejects.toThrow("Allocations must target expense transactions");

    await expect(
      RefundAllocationService.replaceAllocations(
        owner.user.id,
        owner.workspace.id,
        refund.id,
        {
          allocations: [
            { expenseTransactionId: usdExpense.id, amount: "5" },
          ],
        },
      ),
    ).rejects.toThrow("Refund and expense currencies must match");

    await expect(
      RefundAllocationService.replaceAllocations(
        owner.user.id,
        owner.workspace.id,
        refund.id,
        {
          allocations: [
            { expenseTransactionId: otherExpense.id, amount: "5" },
          ],
        },
      ),
    ).rejects.toThrow("One or more expense transactions not found");
  });

  it("supports partial refunds from multiple income transactions", async () => {
    const owner = await createTestUser("refund-partial-multi");
    const expense = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Big purchase",
      { type: TransactionType.EXPENSE, amount: 100 },
    );
    const refundA = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Partial refund A",
      { type: TransactionType.INCOME, amount: 40 },
    );
    const refundB = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Partial refund B",
      { type: TransactionType.INCOME, amount: 30 },
    );

    const a = await RefundAllocationService.replaceAllocations(
      owner.user.id,
      owner.workspace.id,
      refundA.id,
      {
        allocations: [{ expenseTransactionId: expense.id, amount: "40" }],
      },
    );
    const b = await RefundAllocationService.replaceAllocations(
      owner.user.id,
      owner.workspace.id,
      refundB.id,
      {
        allocations: [{ expenseTransactionId: expense.id, amount: "30" }],
      },
    );

    expect(a.refundRemaining).toBe("0");
    expect(b.refundRemaining).toBe("0");

    const suggestions = await RefundAllocationService.getSuggestions(
      owner.user.id,
      owner.workspace.id,
      refundA.id,
    );
    expect(
      suggestions.suggestions.find((s) => s.id === expense.id)?.expenseNet,
    ).toBe("30");
  });

  it("deletes a single allocation", async () => {
    const owner = await createTestUser("refund-delete");
    const refund = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Refund",
      { type: TransactionType.INCOME, amount: 25 },
    );
    const expense = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Expense",
      { type: TransactionType.EXPENSE, amount: 25 },
    );

    const allocated = await RefundAllocationService.replaceAllocations(
      owner.user.id,
      owner.workspace.id,
      refund.id,
      {
        allocations: [{ expenseTransactionId: expense.id, amount: "25" }],
      },
    );
    const allocationId = allocated.refundAllocations![0].id;

    const result = await RefundAllocationService.deleteAllocation(
      owner.user.id,
      owner.workspace.id,
      refund.id,
      allocationId,
    );

    expect(result.refundAllocations).toHaveLength(0);
    expect(result.refundRemaining).toBe("25");
  });
});
