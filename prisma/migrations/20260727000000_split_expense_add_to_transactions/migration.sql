-- Opt-in personal transaction sync for split expenses.
-- Existing expenses keep sync enabled (historical auto-sync); new rows default to false.
ALTER TABLE "SplitExpense" ADD COLUMN "addToTransactions" BOOLEAN NOT NULL DEFAULT false;
UPDATE "SplitExpense" SET "addToTransactions" = true;
