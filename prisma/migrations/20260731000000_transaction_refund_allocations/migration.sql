-- CreateTable
CREATE TABLE "TransactionRefundAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refundTransactionId" TEXT NOT NULL,
    "expenseTransactionId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransactionRefundAllocation_refundTransactionId_fkey" FOREIGN KEY ("refundTransactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransactionRefundAllocation_expenseTransactionId_fkey" FOREIGN KEY ("expenseTransactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionRefundAllocation_refundTransactionId_expenseTransactionId_key" ON "TransactionRefundAllocation"("refundTransactionId", "expenseTransactionId");

-- CreateIndex
CREATE INDEX "TransactionRefundAllocation_expenseTransactionId_idx" ON "TransactionRefundAllocation"("expenseTransactionId");
