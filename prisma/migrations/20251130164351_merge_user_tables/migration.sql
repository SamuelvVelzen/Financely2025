/*
  Warnings:

  - You are about to drop the `BetterAuthUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `betterAuthUserId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isEmailVerified` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "BetterAuthUser_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BetterAuthUser";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BetterAuthAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BetterAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BetterAuthAccount" ("accessToken", "accessTokenExpiresAt", "accountId", "createdAt", "id", "idToken", "password", "providerId", "refreshToken", "refreshTokenExpiresAt", "scope", "updatedAt", "userId") SELECT "accessToken", "accessTokenExpiresAt", "accountId", "createdAt", "id", "idToken", "password", "providerId", "refreshToken", "refreshTokenExpiresAt", "scope", "updatedAt", "userId" FROM "BetterAuthAccount";
DROP TABLE "BetterAuthAccount";
ALTER TABLE "new_BetterAuthAccount" RENAME TO "BetterAuthAccount";
CREATE INDEX "BetterAuthAccount_userId_idx" ON "BetterAuthAccount"("userId");
CREATE UNIQUE INDEX "BetterAuthAccount_providerId_accountId_key" ON "BetterAuthAccount"("providerId", "accountId");
CREATE TABLE "new_BetterAuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BetterAuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BetterAuthSession" ("createdAt", "expiresAt", "id", "ipAddress", "token", "updatedAt", "userAgent", "userId") SELECT "createdAt", "expiresAt", "id", "ipAddress", "token", "updatedAt", "userAgent", "userId" FROM "BetterAuthSession";
DROP TABLE "BetterAuthSession";
ALTER TABLE "new_BetterAuthSession" RENAME TO "BetterAuthSession";
CREATE UNIQUE INDEX "BetterAuthSession_token_key" ON "BetterAuthSession"("token");
CREATE INDEX "BetterAuthSession_userId_idx" ON "BetterAuthSession"("userId");
CREATE INDEX "BetterAuthSession_token_idx" ON "BetterAuthSession"("token");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "primaryEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" DATETIME
);
INSERT INTO "new_User" ("createdAt", "email", "id", "lastLoginAt", "primaryEmail", "status", "updatedAt") SELECT "createdAt", "email", "id", "lastLoginAt", "primaryEmail", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
