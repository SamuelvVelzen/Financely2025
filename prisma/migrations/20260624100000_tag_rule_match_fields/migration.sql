-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TagRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "tagId" TEXT NOT NULL,
    "label" TEXT,
    "keywords" TEXT NOT NULL,
    "pattern" TEXT,
    "patternType" TEXT NOT NULL DEFAULT 'KEYWORD',
    "matchFields" TEXT NOT NULL DEFAULT '["NAME"]',
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
INSERT INTO "new_TagRule" (
    "id",
    "userId",
    "workspaceId",
    "tagId",
    "label",
    "keywords",
    "pattern",
    "patternType",
    "matchFields",
    "applyAs",
    "priority",
    "source",
    "enabled",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "userId",
    "workspaceId",
    "tagId",
    "label",
    "keywords",
    "pattern",
    "patternType",
    CASE
        WHEN "matchField" = 'BOTH' THEN '["NAME","DESCRIPTION"]'
        WHEN "matchField" = 'DESCRIPTION' THEN '["DESCRIPTION"]'
        ELSE '["NAME"]'
    END,
    "applyAs",
    "priority",
    "source",
    "enabled",
    "createdAt",
    "updatedAt"
FROM "TagRule";
DROP TABLE "TagRule";
ALTER TABLE "new_TagRule" RENAME TO "TagRule";
CREATE INDEX "TagRule_workspaceId_enabled_idx" ON "TagRule"("workspaceId", "enabled");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
