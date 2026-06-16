-- CreateTable
CREATE TABLE "TagRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "tagId" TEXT NOT NULL,
    "label" TEXT,
    "keywords" TEXT NOT NULL,
    "pattern" TEXT,
    "patternType" TEXT NOT NULL DEFAULT 'KEYWORD',
    "matchField" TEXT NOT NULL DEFAULT 'NAME',
    "applyAs" TEXT NOT NULL DEFAULT 'PRIMARY',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TagRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TagRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TagRule_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkspaceSetting" (
    "workspaceId" INTEGER NOT NULL PRIMARY KEY,
    "defaultCurrency" TEXT,
    "smartTaggingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "historyLearningEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkspaceSetting_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkspaceSetting" ("workspaceId", "defaultCurrency", "smartTaggingEnabled", "historyLearningEnabled", "createdAt", "updatedAt")
SELECT "workspaceId", "defaultCurrency", true, true, "createdAt", "updatedAt" FROM "WorkspaceSetting";
DROP TABLE "WorkspaceSetting";
ALTER TABLE "new_WorkspaceSetting" RENAME TO "WorkspaceSetting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TagRule_workspaceId_enabled_idx" ON "TagRule"("workspaceId", "enabled");
