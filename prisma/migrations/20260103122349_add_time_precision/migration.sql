/*
  Warnings:

  - Added the required column `transactionDate` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
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
INSERT INTO "new_Transaction" ("amount", "createdAt", "currency", "description", "externalId", "id", "name", "notes", "occurredAt", "transactionDate", "timePrecision", "paymentMethod", "primaryTagId", "type", "updatedAt", "userId") 
SELECT 
    "amount", 
    "createdAt", 
    "currency", 
    "description", 
    "externalId", 
    "id", 
    "name", 
    "notes", 
    "occurredAt", 
    CASE 
        WHEN length("occurredAt") >= 10 AND substr("occurredAt", 5, 1) = '-' AND substr("occurredAt", 8, 1) = '-' 
        THEN substr("occurredAt", 1, 10) || 'T00:00:00.000Z'
        ELSE datetime("occurredAt", 'start of day')
    END as "transactionDate",
    'DateTime' as "timePrecision",
    "paymentMethod", 
    "primaryTagId", 
    "type", 
    "updatedAt", 
    "userId" 
FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_userId_occurredAt_idx" ON "Transaction"("userId", "occurredAt");
CREATE INDEX "Transaction_userId_type_occurredAt_idx" ON "Transaction"("userId", "type", "occurredAt");
CREATE INDEX "Transaction_userId_transactionDate_idx" ON "Transaction"("userId", "transactionDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
