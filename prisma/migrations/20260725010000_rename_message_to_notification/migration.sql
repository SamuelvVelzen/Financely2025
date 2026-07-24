-- Rename Message → Notification (SQLite)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "actions" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Notification" ("id", "userId", "workspaceId", "title", "content", "type", "actions", "read", "readAt", "relatedId", "relatedType", "createdAt", "updatedAt")
SELECT "id", "userId", "workspaceId", "title", "content", "type", "actions", "read", "readAt", "relatedId", "relatedType", "createdAt", "updatedAt" FROM "Message";

DROP TABLE "Message";
ALTER TABLE "new_Notification" RENAME TO "Notification";

CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_type_idx" ON "Notification"("userId", "type");
CREATE INDEX "Notification_workspaceId_read_idx" ON "Notification"("workspaceId", "read");
CREATE INDEX "Notification_workspaceId_createdAt_idx" ON "Notification"("workspaceId", "createdAt");
CREATE INDEX "Notification_workspaceId_type_idx" ON "Notification"("workspaceId", "type");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
