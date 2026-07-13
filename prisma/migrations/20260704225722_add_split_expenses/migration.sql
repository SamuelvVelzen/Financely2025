-- CreateTable
CREATE TABLE "SplitGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "guestAccessToken" TEXT NOT NULL,
    "guestCanView" BOOLEAN NOT NULL DEFAULT true,
    "guestCanAdd" BOOLEAN NOT NULL DEFAULT true,
    "guestCanSettle" BOOLEAN NOT NULL DEFAULT false,
    "guestCanEditOwn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SplitGroup_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SplitGroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "normalizedEmail" TEXT,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "role" TEXT NOT NULL DEFAULT 'member',
    "guestSessionId" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" DATETIME,
    CONSTRAINT "SplitGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SplitGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SplitExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "paidByMemberId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "groupAmount" DECIMAL,
    "conversionStatus" TEXT NOT NULL DEFAULT 'pending',
    "exchangeRateDate" DATETIME,
    "exchangeRate" DECIMAL,
    "description" TEXT NOT NULL,
    "expenseDate" DATETIME NOT NULL,
    "splitMode" TEXT NOT NULL DEFAULT 'equal',
    "createdByUserId" TEXT,
    "clientMutationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SplitExpense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SplitExpense_paidByMemberId_fkey" FOREIGN KEY ("paidByMemberId") REFERENCES "SplitGroupMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SplitExpenseShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "shareAmount" DECIMAL NOT NULL,
    "shareGroupAmount" DECIMAL,
    CONSTRAINT "SplitExpenseShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "SplitExpense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SplitExpenseShare_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SplitGroupMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SplitSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "settledAt" DATETIME NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT,
    "deletedAt" DATETIME,
    "deletedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SplitSettlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SplitSettlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "SplitGroupMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SplitSettlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "SplitGroupMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SplitActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "actorMemberId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitActivity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SplitActivity_actorMemberId_fkey" FOREIGN KEY ("actorMemberId") REFERENCES "SplitGroupMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
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
    "subscriptionId" TEXT,
    "splitExpenseShareId" TEXT,
    "splitSyncDetachedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_primaryTagId_fkey" FOREIGN KEY ("primaryTagId") REFERENCES "Tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_splitExpenseShareId_fkey" FOREIGN KEY ("splitExpenseShareId") REFERENCES "SplitExpenseShare" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "currency", "description", "externalId", "id", "name", "notes", "paymentMethod", "primaryTagId", "subscriptionId", "timePrecision", "transactionDate", "type", "updatedAt", "userId", "workspaceId") SELECT "amount", "createdAt", "currency", "description", "externalId", "id", "name", "notes", "paymentMethod", "primaryTagId", "subscriptionId", "timePrecision", "transactionDate", "type", "updatedAt", "userId", "workspaceId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_splitExpenseShareId_key" ON "Transaction"("splitExpenseShareId");
CREATE INDEX "Transaction_userId_transactionDate_idx" ON "Transaction"("userId", "transactionDate");
CREATE INDEX "Transaction_userId_type_transactionDate_idx" ON "Transaction"("userId", "type", "transactionDate");
CREATE INDEX "Transaction_workspaceId_transactionDate_idx" ON "Transaction"("workspaceId", "transactionDate");
CREATE INDEX "Transaction_workspaceId_type_transactionDate_idx" ON "Transaction"("workspaceId", "type", "transactionDate");
CREATE INDEX "Transaction_subscriptionId_idx" ON "Transaction"("subscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SplitGroup_guestAccessToken_key" ON "SplitGroup"("guestAccessToken");

-- CreateIndex
CREATE INDEX "SplitGroup_createdByUserId_idx" ON "SplitGroup"("createdByUserId");

-- CreateIndex
CREATE INDEX "SplitGroupMember_userId_idx" ON "SplitGroupMember"("userId");

-- CreateIndex
CREATE INDEX "SplitGroupMember_normalizedEmail_idx" ON "SplitGroupMember"("normalizedEmail");

-- CreateIndex
CREATE INDEX "SplitGroupMember_groupId_status_idx" ON "SplitGroupMember"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SplitGroupMember_groupId_userId_key" ON "SplitGroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SplitGroupMember_groupId_normalizedEmail_key" ON "SplitGroupMember"("groupId", "normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "SplitExpense_clientMutationId_key" ON "SplitExpense"("clientMutationId");

-- CreateIndex
CREATE INDEX "SplitExpense_groupId_expenseDate_idx" ON "SplitExpense"("groupId", "expenseDate");

-- CreateIndex
CREATE UNIQUE INDEX "SplitExpenseShare_expenseId_memberId_key" ON "SplitExpenseShare"("expenseId", "memberId");

-- CreateIndex
CREATE INDEX "SplitSettlement_groupId_settledAt_idx" ON "SplitSettlement"("groupId", "settledAt");

-- CreateIndex
CREATE INDEX "SplitActivity_groupId_createdAt_idx" ON "SplitActivity"("groupId", "createdAt");
