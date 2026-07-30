import {
  RefundAllocationSuggestionsResponseSchema,
  ReplaceExpenseRefundAllocationsInputSchema,
  ReplaceRefundAllocationsInputSchema,
  type IRefundAllocationSuggestionsResponse,
  type IReplaceExpenseRefundAllocationsInput,
  type IReplaceRefundAllocationsInput,
  type ITransaction,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { Prisma, TransactionType } from "@prisma/client";
import { roundMoney, toDecimalString } from "./refund-allocation-helpers";
import { TransactionService } from "./transaction.service";

/**
 * Refund allocation service — N:M partial links between INCOME refunds and EXPENSE txs.
 */
export class RefundAllocationService {
  static async replaceAllocations(
    userId: string,
    workspaceId: IWorkspaceId,
    refundTransactionId: string,
    input: IReplaceRefundAllocationsInput,
  ): Promise<ITransaction> {
    const validated = ReplaceRefundAllocationsInputSchema.parse(input);

    const refund = await prisma.transaction.findFirst({
      where: { id: refundTransactionId, userId, workspaceId },
    });
    if (!refund) {
      throw new Error("Transaction not found");
    }
    if (refund.type !== TransactionType.INCOME) {
      throw new Error("Refund allocations require an income transaction");
    }

    const refundAmount = parseFloat(refund.amount.toString());
    const expenseIds = validated.allocations.map((a) => a.expenseTransactionId);
    const uniqueExpenseIds = new Set(expenseIds);
    if (uniqueExpenseIds.size !== expenseIds.length) {
      throw new Error("Duplicate expense allocations are not allowed");
    }

    const totalAllocated = validated.allocations.reduce((sum, a) => {
      const amount = parseFloat(a.amount);
      if (!(amount > 0)) {
        throw new Error("Allocation amount must be greater than zero");
      }
      return sum + amount;
    }, 0);

    if (roundMoney(totalAllocated) > roundMoney(refundAmount)) {
      throw new Error("Allocations exceed refund amount");
    }

    if (validated.allocations.length > 0) {
      const expenses = await prisma.transaction.findMany({
        where: {
          id: { in: expenseIds },
          userId,
          workspaceId,
        },
      });
      if (expenses.length !== expenseIds.length) {
        throw new Error("One or more expense transactions not found");
      }

      const expenseById = new Map(expenses.map((e) => [e.id, e]));
      const existingOnExpenses =
        await prisma.transactionRefundAllocation.findMany({
          where: {
            expenseTransactionId: { in: expenseIds },
            refundTransactionId: { not: refundTransactionId },
          },
        });
      const otherAllocatedByExpense = new Map<string, number>();
      for (const row of existingOnExpenses) {
        const key = row.expenseTransactionId;
        otherAllocatedByExpense.set(
          key,
          (otherAllocatedByExpense.get(key) ?? 0) +
            parseFloat(row.amount.toString()),
        );
      }

      for (const allocation of validated.allocations) {
        const expense = expenseById.get(allocation.expenseTransactionId);
        if (!expense) {
          throw new Error("One or more expense transactions not found");
        }
        if (expense.type !== TransactionType.EXPENSE) {
          throw new Error("Allocations must target expense transactions");
        }
        if (expense.currency !== refund.currency) {
          throw new Error("Refund and expense currencies must match");
        }

        const amount = parseFloat(allocation.amount);
        const otherAllocated =
          otherAllocatedByExpense.get(expense.id) ?? 0;
        const expenseAmount = parseFloat(expense.amount.toString());
        if (roundMoney(otherAllocated + amount) > roundMoney(expenseAmount)) {
          throw new Error(
            `Allocations exceed expense amount for "${expense.name}"`,
          );
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.transactionRefundAllocation.deleteMany({
        where: { refundTransactionId },
      });

      if (validated.allocations.length === 0) {
        return;
      }

      await tx.transactionRefundAllocation.createMany({
        data: validated.allocations.map((allocation) => ({
          refundTransactionId,
          expenseTransactionId: allocation.expenseTransactionId,
          amount: new Prisma.Decimal(allocation.amount),
        })),
      });
    });

    const result = await TransactionService.getTransactionById(
      userId,
      workspaceId,
      refundTransactionId,
    );
    if (!result) {
      throw new Error("Transaction not found");
    }
    return result;
  }

  static async replaceExpenseAllocations(
    userId: string,
    workspaceId: IWorkspaceId,
    expenseTransactionId: string,
    input: IReplaceExpenseRefundAllocationsInput,
  ): Promise<ITransaction> {
    const validated = ReplaceExpenseRefundAllocationsInputSchema.parse(input);

    const expense = await prisma.transaction.findFirst({
      where: { id: expenseTransactionId, userId, workspaceId },
    });
    if (!expense) {
      throw new Error("Transaction not found");
    }
    if (expense.type !== TransactionType.EXPENSE) {
      throw new Error(
        "Expense refund allocations require an expense transaction",
      );
    }

    const expenseAmount = parseFloat(expense.amount.toString());
    const refundIds = validated.allocations.map((a) => a.refundTransactionId);
    const uniqueRefundIds = new Set(refundIds);
    if (uniqueRefundIds.size !== refundIds.length) {
      throw new Error("Duplicate refund allocations are not allowed");
    }

    const totalAllocated = validated.allocations.reduce((sum, a) => {
      const amount = parseFloat(a.amount);
      if (!(amount > 0)) {
        throw new Error("Allocation amount must be greater than zero");
      }
      return sum + amount;
    }, 0);

    if (roundMoney(totalAllocated) > roundMoney(expenseAmount)) {
      throw new Error("Allocations exceed expense amount");
    }

    if (validated.allocations.length > 0) {
      const refunds = await prisma.transaction.findMany({
        where: {
          id: { in: refundIds },
          userId,
          workspaceId,
        },
      });
      if (refunds.length !== refundIds.length) {
        throw new Error("One or more refund transactions not found");
      }

      const refundById = new Map(refunds.map((r) => [r.id, r]));
      const existingOnRefunds =
        await prisma.transactionRefundAllocation.findMany({
          where: {
            refundTransactionId: { in: refundIds },
            expenseTransactionId: { not: expenseTransactionId },
          },
        });
      const otherAllocatedByRefund = new Map<string, number>();
      for (const row of existingOnRefunds) {
        const key = row.refundTransactionId;
        otherAllocatedByRefund.set(
          key,
          (otherAllocatedByRefund.get(key) ?? 0) +
            parseFloat(row.amount.toString()),
        );
      }

      for (const allocation of validated.allocations) {
        const refund = refundById.get(allocation.refundTransactionId);
        if (!refund) {
          throw new Error("One or more refund transactions not found");
        }
        if (refund.type !== TransactionType.INCOME) {
          throw new Error("Allocations must target income transactions");
        }
        if (refund.currency !== expense.currency) {
          throw new Error("Refund and expense currencies must match");
        }

        const amount = parseFloat(allocation.amount);
        const otherAllocated = otherAllocatedByRefund.get(refund.id) ?? 0;
        const refundAmount = parseFloat(refund.amount.toString());
        if (roundMoney(otherAllocated + amount) > roundMoney(refundAmount)) {
          throw new Error(
            `Allocations exceed refund amount for "${refund.name}"`,
          );
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.transactionRefundAllocation.deleteMany({
        where: { expenseTransactionId },
      });

      if (validated.allocations.length === 0) {
        return;
      }

      await tx.transactionRefundAllocation.createMany({
        data: validated.allocations.map((allocation) => ({
          refundTransactionId: allocation.refundTransactionId,
          expenseTransactionId,
          amount: new Prisma.Decimal(allocation.amount),
        })),
      });
    });

    const result = await TransactionService.getTransactionById(
      userId,
      workspaceId,
      expenseTransactionId,
    );
    if (!result) {
      throw new Error("Transaction not found");
    }
    return result;
  }

  static async deleteAllocation(
    userId: string,
    workspaceId: IWorkspaceId,
    refundTransactionId: string,
    allocationId: string,
  ): Promise<ITransaction> {
    const allocation = await prisma.transactionRefundAllocation.findFirst({
      where: {
        id: allocationId,
        refundTransactionId,
        refundTransaction: { userId, workspaceId },
      },
    });
    if (!allocation) {
      throw new Error("Allocation not found");
    }

    await prisma.transactionRefundAllocation.delete({
      where: { id: allocationId },
    });

    const result = await TransactionService.getTransactionById(
      userId,
      workspaceId,
      refundTransactionId,
    );
    if (!result) {
      throw new Error("Transaction not found");
    }
    return result;
  }

  static async getSuggestions(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
  ): Promise<IRefundAllocationSuggestionsResponse> {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId, workspaceId },
      include: {
        refundAllocations: true,
        expenseRefundAllocations: true,
      },
    });
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.type === TransactionType.INCOME) {
      return this.getExpenseSuggestionsForRefund(
        userId,
        workspaceId,
        transaction,
      );
    }

    if (transaction.type === TransactionType.EXPENSE) {
      return this.getRefundSuggestionsForExpense(
        userId,
        workspaceId,
        transaction,
      );
    }

    throw new Error(
      "Refund suggestions require an income or expense transaction",
    );
  }

  private static async getExpenseSuggestionsForRefund(
    userId: string,
    workspaceId: IWorkspaceId,
    refund: {
      id: string;
      name: string;
      amount: { toString(): string };
      currency: string;
      transactionDate: Date;
      refundAllocations: Array<{ amount: { toString(): string } }>;
    },
  ): Promise<IRefundAllocationSuggestionsResponse> {
    const allocated = refund.refundAllocations.reduce(
      (sum, a) => sum + parseFloat(a.amount.toString()),
      0,
    );
    const refundRemaining = roundMoney(
      parseFloat(refund.amount.toString()) - allocated,
    );

    const refundDate = refund.transactionDate;
    const windowStart = new Date(refundDate);
    windowStart.setUTCDate(windowStart.getUTCDate() - 60);
    const windowEnd = new Date(refundDate);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 60);

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        workspaceId,
        type: TransactionType.EXPENSE,
        currency: refund.currency,
        transactionDate: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        primaryTag: {
          select: { id: true, name: true, color: true, emoticon: true },
        },
        expenseRefundAllocations: true,
      },
      take: 100,
      orderBy: { transactionDate: "desc" },
    });

    const refundName = refund.name.toLowerCase();
    const suggestions = expenses
      .map((expense) => {
        const refunded = expense.expenseRefundAllocations.reduce(
          (sum, a) => sum + parseFloat(a.amount.toString()),
          0,
        );
        const expenseNet = roundMoney(
          parseFloat(expense.amount.toString()) - refunded,
        );
        if (expenseNet <= 0) {
          return null;
        }

        const expenseName = expense.name.toLowerCase();
        let score = 0;
        if (
          refundName.length > 0 &&
          (expenseName.includes(refundName) || refundName.includes(expenseName))
        ) {
          score += 50;
        }
        const amountDiff = Math.abs(expenseNet - refundRemaining);
        score += Math.max(0, 30 - amountDiff);
        const daysDiff = Math.abs(
          (expense.transactionDate.getTime() - refundDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        score += Math.max(0, 20 - daysDiff / 3);

        return {
          score,
          suggestion: {
            id: expense.id,
            name: expense.name,
            amount: expense.amount.toString(),
            currency: expense.currency,
            transactionDate: expense.transactionDate.toISOString(),
            expenseNet: toDecimalString(expenseNet),
            primaryTag: expense.primaryTag
              ? {
                  id: expense.primaryTag.id,
                  name: expense.primaryTag.name,
                  color: expense.primaryTag.color,
                  emoticon: expense.primaryTag.emoticon,
                }
              : null,
          },
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((row) => row.suggestion);

    return RefundAllocationSuggestionsResponseSchema.parse({
      suggestions,
      refundRemaining: toDecimalString(Math.max(0, refundRemaining)),
    });
  }

  private static async getRefundSuggestionsForExpense(
    userId: string,
    workspaceId: IWorkspaceId,
    expense: {
      id: string;
      name: string;
      amount: { toString(): string };
      currency: string;
      transactionDate: Date;
      expenseRefundAllocations: Array<{ amount: { toString(): string } }>;
    },
  ): Promise<IRefundAllocationSuggestionsResponse> {
    const refunded = expense.expenseRefundAllocations.reduce(
      (sum, a) => sum + parseFloat(a.amount.toString()),
      0,
    );
    const expenseRemaining = roundMoney(
      parseFloat(expense.amount.toString()) - refunded,
    );

    const expenseDate = expense.transactionDate;
    const windowStart = new Date(expenseDate);
    windowStart.setUTCDate(windowStart.getUTCDate() - 60);
    const windowEnd = new Date(expenseDate);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 60);

    const refunds = await prisma.transaction.findMany({
      where: {
        userId,
        workspaceId,
        type: TransactionType.INCOME,
        currency: expense.currency,
        transactionDate: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        primaryTag: {
          select: { id: true, name: true, color: true, emoticon: true },
        },
        refundAllocations: true,
      },
      take: 100,
      orderBy: { transactionDate: "desc" },
    });

    const expenseName = expense.name.toLowerCase();
    const suggestions = refunds
      .map((refund) => {
        const allocated = refund.refundAllocations.reduce(
          (sum, a) => sum + parseFloat(a.amount.toString()),
          0,
        );
        const refundRemaining = roundMoney(
          parseFloat(refund.amount.toString()) - allocated,
        );
        if (refundRemaining <= 0) {
          return null;
        }

        const refundName = refund.name.toLowerCase();
        let score = 0;
        if (
          expenseName.length > 0 &&
          (refundName.includes(expenseName) || expenseName.includes(refundName))
        ) {
          score += 50;
        }
        const amountDiff = Math.abs(refundRemaining - expenseRemaining);
        score += Math.max(0, 30 - amountDiff);
        const daysDiff = Math.abs(
          (refund.transactionDate.getTime() - expenseDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        score += Math.max(0, 20 - daysDiff / 3);

        return {
          score,
          suggestion: {
            id: refund.id,
            name: refund.name,
            amount: refund.amount.toString(),
            currency: refund.currency,
            transactionDate: refund.transactionDate.toISOString(),
            expenseNet: toDecimalString(refundRemaining),
            primaryTag: refund.primaryTag
              ? {
                  id: refund.primaryTag.id,
                  name: refund.primaryTag.name,
                  color: refund.primaryTag.color,
                  emoticon: refund.primaryTag.emoticon,
                }
              : null,
          },
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((row) => row.suggestion);

    return RefundAllocationSuggestionsResponseSchema.parse({
      suggestions,
      refundRemaining: toDecimalString(Math.max(0, expenseRemaining)),
    });
  }
}
