import { prisma } from "@/features/util/prisma";
import { WorkspaceService } from "@/features/workspace/services/workspace.service";
import type { Prisma } from "@prisma/client";
import { TransactionType } from "@prisma/client";

export class SplitTransactionSyncService {
  static async buildPristineTransactionDeleteOperations(
    shareIds: string[],
  ): Promise<Prisma.PrismaPromise<unknown>[]> {
    if (shareIds.length === 0) {
      return [];
    }

    const shares = await prisma.splitExpenseShare.findMany({
      where: { id: { in: shareIds } },
      include: { transaction: true },
    });

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    for (const share of shares) {
      if (share.transaction && !share.transaction.splitSyncDetachedAt) {
        operations.push(
          prisma.transaction.delete({
            where: { id: share.transaction.id },
          }),
        );
      }
    }

    return operations;
  }

  static async upsertTransactionForShare(
    shareId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    const share = await tx.splitExpenseShare.findUnique({
      where: { id: shareId },
      include: {
        member: true,
        expense: { include: { group: true } },
        transaction: true,
      },
    });

    if (!share) return;
    if (share.status !== "active" || !share.addToTransactions) {
      await this.deletePristineTransactionForShare(shareId, tx);
      return;
    }

    const member = share.member;
    if (!member.userId || member.status !== "linked") {
      return;
    }

    const userId = member.userId;
    const setting = await tx.userSetting.findUnique({
      where: { userId },
      select: { defaultWorkspaceId: true },
    });

    const workspaceId =
      setting?.defaultWorkspaceId ??
      (await WorkspaceService.getDefaultWorkspaceIdForUser(userId));

    const amount = share.shareAmount.toString();
    const currency = share.expense.currency;
    const name = `Split: ${share.expense.description}`;
    const description = `From split group · ${share.expense.group.name}`;

    if (share.transaction && !share.transaction.splitSyncDetachedAt) {
      await tx.transaction.update({
        where: { id: share.transaction.id },
        data: {
          amount,
          currency,
          transactionDate: share.expense.expenseDate,
          name,
          description,
        },
      });
      return;
    }

    if (share.transaction?.splitSyncDetachedAt) {
      return;
    }

    const transaction = await tx.transaction.create({
      data: {
        userId,
        workspaceId,
        type: TransactionType.EXPENSE,
        amount,
        currency,
        transactionDate: share.expense.expenseDate,
        name,
        description,
        paymentMethod: "OTHER",
        splitExpenseShareId: share.id,
      },
    });

    await tx.splitExpenseShare.update({
      where: { id: shareId },
      data: {},
    });

    void transaction;
  }

  static async deletePristineTransactionForShare(
    shareId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    const share = await tx.splitExpenseShare.findUnique({
      where: { id: shareId },
      include: { transaction: true },
    });

    if (!share?.transaction) return;
    if (share.transaction.splitSyncDetachedAt) return;

    await tx.transaction.delete({
      where: { id: share.transaction.id },
    });
  }

  static async syncSharesForExpense(
    expenseId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    const shares = await tx.splitExpenseShare.findMany({
      where: { expenseId },
    });

    for (const share of shares) {
      if (share.status === "active") {
        await this.upsertTransactionForShare(share.id, tx);
      } else {
        await this.deletePristineTransactionForShare(share.id, tx);
      }
    }
  }

  static async detachTransaction(
    userId: string,
    transactionId: string,
  ): Promise<void> {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId, splitExpenseShareId: { not: null } },
    });

    if (!transaction?.splitExpenseShareId) {
      throw new Error("Transaction is not split-linked");
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        splitSyncDetachedAt: new Date(),
        splitExpenseShareId: null,
      },
    });
  }

  static async backfillForUser(userId: string): Promise<void> {
    const shares = await prisma.splitExpenseShare.findMany({
      where: {
        status: "active",
        member: { userId, status: "linked" },
      },
      select: { id: true },
    });

    for (const share of shares) {
      await this.upsertTransactionForShare(share.id);
    }
  }
}
