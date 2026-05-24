import {
  cleanupTestUsers,
  createTestTransaction,
  createTestUser,
} from "@/test/db-helpers";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { TransactionService } from "./transaction.service";

describe("TransactionService workspace isolation", () => {
  beforeEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("does not return another user's transaction in a different workspace", async () => {
    const owner = await createTestUser("tx-owner");
    const other = await createTestUser("tx-other");
    const transaction = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Owner only",
    );

    const result = await TransactionService.getTransactionById(
      other.user.id,
      other.workspace.id,
      transaction.id,
    );

    expect(result).toBeNull();
  });

  it("returns a transaction for the owning user and workspace", async () => {
    const owner = await createTestUser("tx-owner-ok");
    const transaction = await createTestTransaction(
      owner.user.id,
      owner.workspace.id,
      "Visible to owner",
    );

    const result = await TransactionService.getTransactionById(
      owner.user.id,
      owner.workspace.id,
      transaction.id,
    );

    expect(result?.id).toBe(transaction.id);
    expect(result?.name).toBe("Visible to owner");
  });
});
