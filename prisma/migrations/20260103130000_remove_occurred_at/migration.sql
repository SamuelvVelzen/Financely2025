-- Remove occurredAt column from Transaction table
-- Migration: remove_occurred_at
-- This migration removes the occurredAt field and uses only transactionDate

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_primaryTagId_fkey" FOREIGN KEY ("primaryTagId") REFERENCES "Tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy data from old table, using transactionDate (which should already exist)
INSERT INTO "new_Transaction" (
    "id", "userId", "type", "amount", "currency", "transactionDate", "timePrecision",
    "name", "description", "notes", "externalId", "paymentMethod", "primaryTagId",
    "createdAt", "updatedAt"
)
SELECT 
    "id", "userId", "type", "amount", "currency", "transactionDate", "timePrecision",
    "name", "description", "notes", "externalId", "paymentMethod", "primaryTagId",
    "createdAt", "updatedAt"
FROM "Transaction";

DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";

-- Recreate indexes
CREATE INDEX "Transaction_userId_transactionDate_idx" ON "Transaction"("userId", "transactionDate");
CREATE INDEX "Transaction_userId_type_transactionDate_idx" ON "Transaction"("userId", "type", "transactionDate");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

