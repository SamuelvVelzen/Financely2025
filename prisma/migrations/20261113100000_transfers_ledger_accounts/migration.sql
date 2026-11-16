-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "openingBalance" DECIMAL NOT NULL DEFAULT 0,
    "openingBalanceDate" DATETIME,
    "bank" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LedgerAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LedgerAccount_workspaceId_idx" ON "LedgerAccount"("workspaceId");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "transferDirection" TEXT,
    "transferGroupId" TEXT,
    "ledgerAccountId" TEXT,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "transactionDate" DATETIME NOT NULL,
    "timePrecision" TEXT NOT NULL DEFAULT 'DateTime',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "externalId" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "primaryTagId" TEXT,
    "subscriptionId" TEXT,
    "splitExpenseShareId" TEXT,
    "splitSyncDetachedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_primaryTagId_fkey" FOREIGN KEY ("primaryTagId") REFERENCES "Tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_splitExpenseShareId_fkey" FOREIGN KEY ("splitExpenseShareId") REFERENCES "SplitExpenseShare" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "currency", "description", "externalId", "id", "name", "notes", "paymentMethod", "primaryTagId", "splitExpenseShareId", "splitSyncDetachedAt", "subscriptionId", "timePrecision", "transactionDate", "type", "updatedAt", "userId", "workspaceId")
SELECT "amount", "createdAt", "currency", "description", "externalId", "id", "name", "notes", "paymentMethod", "primaryTagId", "splitExpenseShareId", "splitSyncDetachedAt", "subscriptionId", "timePrecision", "transactionDate", "type", "updatedAt", "userId", "workspaceId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_userId_transactionDate_idx" ON "Transaction"("userId", "transactionDate");
CREATE INDEX "Transaction_userId_type_transactionDate_idx" ON "Transaction"("userId", "type", "transactionDate");
CREATE INDEX "Transaction_workspaceId_transactionDate_idx" ON "Transaction"("workspaceId", "transactionDate");
CREATE INDEX "Transaction_workspaceId_type_transactionDate_idx" ON "Transaction"("workspaceId", "type", "transactionDate");
CREATE INDEX "Transaction_subscriptionId_idx" ON "Transaction"("subscriptionId");
CREATE INDEX "Transaction_ledgerAccountId_transactionDate_idx" ON "Transaction"("ledgerAccountId", "transactionDate");
CREATE INDEX "Transaction_transferGroupId_idx" ON "Transaction"("transferGroupId");
CREATE UNIQUE INDEX "Transaction_splitExpenseShareId_key" ON "Transaction"("splitExpenseShareId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
