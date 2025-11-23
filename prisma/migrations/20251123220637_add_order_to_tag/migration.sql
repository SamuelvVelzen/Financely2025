/*
  Warnings:

  - Added the required column `order` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Insert existing tags with order values based on creation date
INSERT INTO "new_Tag" ("color", "createdAt", "description", "id", "name", "updatedAt", "userId", "order")
SELECT 
    "color", 
    "createdAt", 
    "description", 
    "id", 
    "name", 
    "updatedAt", 
    "userId",
    (SELECT COUNT(*) FROM "Tag" t2 WHERE t2."userId" = "Tag"."userId" AND (t2."createdAt" < "Tag"."createdAt" OR (t2."createdAt" = "Tag"."createdAt" AND t2."id" <= "Tag"."id"))) as "order"
FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
