/*
  Warnings:

  - Made the column `firstName` on table `UserInfo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `UserInfo` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "name" TEXT
);
INSERT INTO "new_UserInfo" ("createdAt", "email", "emailVerified", "firstName", "id", "image", "lastName", "name", "suffix", "updatedAt") SELECT "createdAt", "email", "emailVerified", "firstName", "id", "image", "lastName", "name", "suffix", "updatedAt" FROM "UserInfo";
DROP TABLE "UserInfo";
ALTER TABLE "new_UserInfo" RENAME TO "UserInfo";
CREATE UNIQUE INDEX "UserInfo_email_key" ON "UserInfo"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
