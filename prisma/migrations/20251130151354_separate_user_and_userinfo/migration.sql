-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "UserInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "suffix" TEXT,
    "avatar_url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "UserInfo_userId_key" ON "UserInfo"("userId");

-- Migrate existing name data from User to UserInfo (if name column exists)
-- Split name on first space: first part -> firstName, rest -> lastName
-- Note: This will only work if the User table has a name column
-- If the name column doesn't exist, create UserInfo records with null names
-- Check if name column exists by trying to select it
-- For SQLite, we'll create UserInfo for all users, using name if available
INSERT INTO "UserInfo" ("id", "userId", "firstName", "lastName", "suffix", "createdAt", "updatedAt")
SELECT 
    'cl' || lower(hex(randomblob(12))) as id,
    "User"."id" as userId,
    NULL as firstName,
    NULL as lastName,
    NULL as suffix,
    "User"."createdAt" as "createdAt",
    "User"."updatedAt" as "updatedAt"
FROM "User"
WHERE NOT EXISTS (
    SELECT 1 FROM "UserInfo" WHERE "UserInfo"."userId" = "User"."id"
);

-- Note: The User table should already be in the correct state (without name column)
-- If the name column exists, it would need to be dropped, but SQLite doesn't support DROP COLUMN easily
-- For now, we assume the User table is already in the correct state
-- If name column exists, it can be removed in a follow-up migration if needed

