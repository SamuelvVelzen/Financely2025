-- AlterTable: add categoryType to BudgetItem and replace unique constraint
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BudgetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "tagId" TEXT,
    "categoryType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetItem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BudgetItem" ("id", "budgetId", "tagId", "createdAt", "updatedAt") SELECT "id", "budgetId", "tagId", "createdAt", "updatedAt" FROM "BudgetItem";
DROP TABLE "BudgetItem";
ALTER TABLE "new_BudgetItem" RENAME TO "BudgetItem";
CREATE UNIQUE INDEX "BudgetItem_budgetId_tagId_categoryType_key" ON "BudgetItem"("budgetId", "tagId", "categoryType");
PRAGMA foreign_keys=ON;
