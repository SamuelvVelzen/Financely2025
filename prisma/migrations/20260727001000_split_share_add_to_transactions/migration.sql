-- Per-member opt-in: move addToTransactions from expense to share.
ALTER TABLE "SplitExpenseShare" ADD COLUMN "addToTransactions" BOOLEAN NOT NULL DEFAULT false;

-- Keep opt-in for shares that already have a linked personal transaction.
UPDATE "SplitExpenseShare"
SET "addToTransactions" = true
WHERE "id" IN (
  SELECT "splitExpenseShareId" FROM "Transaction"
  WHERE "splitExpenseShareId" IS NOT NULL
);

ALTER TABLE "SplitExpense" DROP COLUMN "addToTransactions";
