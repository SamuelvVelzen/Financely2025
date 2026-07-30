import { prisma } from "@/features/util/prisma";
import {
  canEditExpense,
  requireActiveMemberForUser,
} from "../auth/split-group-access";
import { parseSplitMode } from "../utils/split-mode";
import { SplitActivityService } from "./split-activity.service";
import { SplitCurrencyService } from "./split-currency.service";
import { SplitTransactionSyncService } from "./split-transaction-sync.service";
import type {
  ICreateSplitExpenseInput,
  IUpdateSplitExpenseInput,
} from "../validation/schemas";

type IMappedShare = {
  id: string;
  memberId: string;
  displayName: string;
  shareAmount: string;
  shareGroupAmount: string | null;
  status: string;
  addToTransactions: boolean;
};

export class SplitExpenseService {
  static async listExpensesForGroup(
    groupId: string,
    viewerMemberId?: string,
  ) {
    const expenses = await prisma.splitExpense.findMany({
      where: { groupId },
      include: {
        paidByMember: { select: { id: true, displayName: true } },
        shares: {
          include: {
            member: { select: { id: true, displayName: true } },
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    });

    return expenses.map((e) => SplitExpenseService.mapExpense(e, viewerMemberId));
  }

  private static mapShares(
    shares: Array<{
      id: string;
      memberId: string;
      shareAmount: { toString(): string };
      shareGroupAmount: { toString(): string } | null;
      status: string;
      addToTransactions: boolean;
      member: { id: string; displayName: string };
    }>,
  ): IMappedShare[] {
    return shares.map((s) => ({
      id: s.id,
      memberId: s.memberId,
      displayName: s.member.displayName,
      shareAmount: s.shareAmount.toString(),
      shareGroupAmount: s.shareGroupAmount?.toString() ?? null,
      status: s.status,
      addToTransactions: s.addToTransactions,
    }));
  }

  private static viewerAddToTransactions(
    shares: IMappedShare[],
    viewerMemberId?: string,
  ): boolean {
    if (viewerMemberId == null) {
      return false;
    }
    return (
      shares.find(
        (share) =>
          share.memberId === viewerMemberId && share.status === "active",
      )?.addToTransactions ?? false
    );
  }

  private static mapExpense(
    e: Awaited<
      ReturnType<typeof prisma.splitExpense.findMany>
    >[number] & {
      paidByMember: { id: string; displayName: string };
      shares: Array<{
        id: string;
        memberId: string;
        shareAmount: { toString(): string };
        shareGroupAmount: { toString(): string } | null;
        status: string;
        addToTransactions: boolean;
        member: { id: string; displayName: string };
      }>;
    },
    viewerMemberId?: string,
  ) {
    const shares = this.mapShares(e.shares);
    return {
      id: e.id,
      description: e.description,
      amount: e.amount.toString(),
      currency: e.currency,
      groupAmount: e.groupAmount?.toString() ?? null,
      conversionStatus: e.conversionStatus,
      expenseDate: e.expenseDate.toISOString(),
      splitMode: e.splitMode,
      addToTransactions: this.viewerAddToTransactions(shares, viewerMemberId),
      paidByMemberId: e.paidByMemberId,
      paidByDisplayName: e.paidByMember.displayName,
      createdByUserId: e.createdByUserId,
      clientMutationId: e.clientMutationId,
      shares,
      createdAt: e.createdAt.toISOString(),
    };
  }

  static async listExpenses(groupId: string, userId: string) {
    const member = await requireActiveMemberForUser(groupId, userId);
    return this.listExpensesForGroup(groupId, member.id);
  }

  static async createExpenseForMember(
    groupId: string,
    actorMemberId: string,
    createdByUserId: string | null,
    input: ICreateSplitExpenseInput,
  ) {
    if (input.clientMutationId) {
      const existing = await prisma.splitExpense.findUnique({
        where: { clientMutationId: input.clientMutationId },
      });
      if (existing) {
        return this.getExpenseById(existing.id, groupId, actorMemberId);
      }
    }

    const member = await prisma.splitGroupMember.findFirstOrThrow({
      where: { id: actorMemberId, groupId },
    });
    const group = await prisma.splitGroup.findUniqueOrThrow({
      where: { id: groupId },
    });

    const expenseDate = new Date(input.expenseDate);
    const conversion = await SplitCurrencyService.convertExpense({
      amount: input.amount,
      currency: input.currency,
      groupCurrency: group.defaultCurrency,
      expenseDate,
      splitMode: input.splitMode,
      participantMemberIds: input.participantMemberIds,
      payerMemberId: input.paidByMemberId,
      exactShares: input.exactShares,
    });

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.splitExpense.create({
        data: {
          groupId,
          paidByMemberId: input.paidByMemberId,
          amount: input.amount,
          currency: input.currency,
          groupAmount: conversion.groupAmount,
          conversionStatus: conversion.conversionStatus,
          exchangeRateDate: conversion.exchangeRateDate,
          exchangeRate: conversion.exchangeRate,
          description: input.description.trim(),
          expenseDate,
          splitMode: input.splitMode,
          createdByUserId,
          clientMutationId: input.clientMutationId ?? null,
          shares: {
            create: conversion.shares.map((s) => ({
              memberId: s.memberId,
              shareAmount: s.shareAmount,
              shareGroupAmount: s.shareGroupAmount,
              status: "active",
              addToTransactions:
                input.addToTransactions && s.memberId === actorMemberId,
            })),
          },
        },
        include: { shares: true },
      });

      await SplitActivityService.log(
        groupId,
        {
          actorMemberId: member.id,
          action: "created",
          entityType: "expense",
          entityId: created.id,
          after: { description: created.description, amount: input.amount },
        },
        tx,
      );

      return created;
    });

    await SplitTransactionSyncService.syncSharesForExpense(expense.id);

    return this.getExpenseById(expense.id, groupId, actorMemberId);
  }

  static async createExpense(
    groupId: string,
    userId: string,
    input: ICreateSplitExpenseInput,
  ) {
    const member = await requireActiveMemberForUser(groupId, userId);
    return this.createExpenseForMember(groupId, member.id, userId, input);
  }

  static async updateExpense(
    groupId: string,
    expenseId: string,
    userId: string,
    input: IUpdateSplitExpenseInput,
  ) {
    const member = await requireActiveMemberForUser(groupId, userId);
    const expense = await prisma.splitExpense.findFirstOrThrow({
      where: { id: expenseId, groupId },
    });

    if (!canEditExpense(member, expense, userId)) {
      throw new Error("Not allowed to edit this expense");
    }

    const group = await prisma.splitGroup.findUniqueOrThrow({
      where: { id: groupId },
    });

    const amount = input.amount ?? expense.amount.toString();
    const currency = input.currency ?? expense.currency;
    const expenseDate = input.expenseDate
      ? new Date(input.expenseDate)
      : expense.expenseDate;
    const splitMode = parseSplitMode(input.splitMode ?? expense.splitMode);
    const paidByMemberId = input.paidByMemberId ?? expense.paidByMemberId;
    const existingShares = await prisma.splitExpenseShare.findMany({
      where: { expenseId },
      select: {
        id: true,
        memberId: true,
        shareAmount: true,
        status: true,
        addToTransactions: true,
      },
    });
    const participantMemberIds =
      input.participantMemberIds ??
      existingShares
        .filter((s) => s.status === "active")
        .map((s) => s.memberId);

    const storedExactShares = existingShares
      .filter((s) => s.status === "active")
      .map((s) => ({
        memberId: s.memberId,
        shareAmount: s.shareAmount.toString(),
      }));

    const addToTransactionsByMemberId = new Map(
      existingShares.map((s) => [s.memberId, s.addToTransactions]),
    );

    // Prefer client share inputs. Otherwise recompute from saved money amounts
    // (percent/share weights are not persisted separately).
    const computationMode =
      input.exactShares != null
        ? splitMode
        : splitMode === "equal"
          ? "equal"
          : "exact";
    const exactShares =
      input.exactShares ??
      (computationMode === "equal" ? undefined : storedExactShares);

    const conversion = await SplitCurrencyService.convertExpense({
      amount,
      currency,
      groupCurrency: group.defaultCurrency,
      expenseDate,
      splitMode: computationMode,
      participantMemberIds,
      payerMemberId: paidByMemberId,
      exactShares,
    });

    await prisma.$transaction(async (tx) => {
      for (const share of existingShares) {
        await SplitTransactionSyncService.deletePristineTransactionForShare(
          share.id,
          tx,
        );
      }
      await tx.splitExpenseShare.deleteMany({ where: { expenseId } });

      await tx.splitExpense.update({
        where: { id: expenseId },
        data: {
          paidByMemberId,
          amount,
          currency,
          groupAmount: conversion.groupAmount,
          conversionStatus: conversion.conversionStatus,
          exchangeRateDate: conversion.exchangeRateDate,
          exchangeRate: conversion.exchangeRate,
          description: input.description?.trim() ?? expense.description,
          expenseDate,
          splitMode,
          shares: {
            create: conversion.shares.map((s) => ({
              memberId: s.memberId,
              shareAmount: s.shareAmount,
              shareGroupAmount: s.shareGroupAmount,
              status: "active",
              addToTransactions:
                s.memberId === member.id && input.addToTransactions !== undefined
                  ? input.addToTransactions
                  : (addToTransactionsByMemberId.get(s.memberId) ?? false),
            })),
          },
        },
      });

      await SplitActivityService.log(
        groupId,
        {
          actorMemberId: member.id,
          action: "updated",
          entityType: "expense",
          entityId: expenseId,
        },
        tx,
      );
    });

    await SplitTransactionSyncService.syncSharesForExpense(expenseId);

    return this.getExpenseById(expenseId, groupId, member.id);
  }

  static async setAddToTransactions(
    groupId: string,
    expenseId: string,
    userId: string,
    addToTransactions: boolean,
  ) {
    const member = await requireActiveMemberForUser(groupId, userId);
    const share = await prisma.splitExpenseShare.findFirst({
      where: {
        expenseId,
        memberId: member.id,
        status: "active",
        expense: { groupId },
      },
    });

    if (!share) {
      throw new Error("You are not a participant on this expense");
    }

    await prisma.splitExpenseShare.update({
      where: { id: share.id },
      data: { addToTransactions },
    });

    await SplitTransactionSyncService.upsertTransactionForShare(share.id);

    return this.getExpenseById(expenseId, groupId, member.id);
  }

  static async deleteExpense(
    groupId: string,
    expenseId: string,
    userId: string,
  ): Promise<void> {
    const member = await requireActiveMemberForUser(groupId, userId);
    const expense = await prisma.splitExpense.findFirstOrThrow({
      where: { id: expenseId, groupId },
      include: { shares: true },
    });

    if (!canEditExpense(member, expense, userId)) {
      throw new Error("Not allowed to delete this expense");
    }

    await prisma.$transaction(async (tx) => {
      for (const share of expense.shares) {
        await SplitTransactionSyncService.deletePristineTransactionForShare(
          share.id,
          tx,
        );
      }
      await tx.splitExpense.delete({ where: { id: expenseId } });
      await SplitActivityService.log(
        groupId,
        {
          actorMemberId: member.id,
          action: "deleted",
          entityType: "expense",
          entityId: expenseId,
        },
        tx,
      );
    });
  }

  static async convertExpense(groupId: string, expenseId: string, userId: string) {
    await requireActiveMemberForUser(groupId, userId);
    const expense = await prisma.splitExpense.findFirstOrThrow({
      where: { id: expenseId, groupId },
      include: { shares: { where: { status: "active" } } },
    });

    const group = await prisma.splitGroup.findUniqueOrThrow({
      where: { id: groupId },
    });

    const addToTransactionsByMemberId = new Map(
      expense.shares.map((s) => [s.memberId, s.addToTransactions]),
    );

    const conversion = await SplitCurrencyService.convertExpense({
      amount: expense.amount.toString(),
      currency: expense.currency,
      groupCurrency: group.defaultCurrency,
      expenseDate: expense.expenseDate,
      // Share rows store money amounts; always recompute FX from those.
      splitMode: "exact",
      participantMemberIds: expense.shares.map((s) => s.memberId),
      payerMemberId: expense.paidByMemberId,
      exactShares: expense.shares.map((s) => ({
        memberId: s.memberId,
        shareAmount: s.shareAmount.toString(),
      })),
    });

    await prisma.$transaction(async (tx) => {
      for (const share of expense.shares) {
        await SplitTransactionSyncService.deletePristineTransactionForShare(
          share.id,
          tx,
        );
      }
      await tx.splitExpenseShare.deleteMany({ where: { expenseId } });
      await tx.splitExpense.update({
        where: { id: expenseId },
        data: {
          groupAmount: conversion.groupAmount,
          conversionStatus: conversion.conversionStatus,
          exchangeRateDate: conversion.exchangeRateDate,
          exchangeRate: conversion.exchangeRate,
          shares: {
            create: conversion.shares.map((s) => ({
              memberId: s.memberId,
              shareAmount: s.shareAmount,
              shareGroupAmount: s.shareGroupAmount,
              status: "active",
              addToTransactions:
                addToTransactionsByMemberId.get(s.memberId) ?? false,
            })),
          },
        },
      });
    });

    await SplitTransactionSyncService.syncSharesForExpense(expenseId);

    return this.getExpenseById(expenseId, groupId);
  }

  static async convertAllPending(groupId: string, userId: string) {
    await requireActiveMemberForUser(groupId, userId);
    const pending = await prisma.splitExpense.findMany({
      where: { groupId, conversionStatus: "pending" },
      select: { id: true },
    });

    for (const e of pending) {
      await this.convertExpense(groupId, e.id, userId);
    }

    return { converted: pending.length };
  }

  private static async getExpenseById(
    expenseId: string,
    groupId: string,
    viewerMemberId?: string,
  ) {
    const expense = await prisma.splitExpense.findFirstOrThrow({
      where: { id: expenseId, groupId },
      include: {
        paidByMember: { select: { id: true, displayName: true } },
        shares: {
          include: { member: { select: { id: true, displayName: true } } },
        },
        group: { select: { id: true } },
      },
    });

    const shares = this.mapShares(expense.shares);
    return {
      id: expense.id,
      groupId: expense.groupId,
      description: expense.description,
      amount: expense.amount.toString(),
      currency: expense.currency,
      groupAmount: expense.groupAmount?.toString() ?? null,
      conversionStatus: expense.conversionStatus,
      expenseDate: expense.expenseDate.toISOString(),
      splitMode: expense.splitMode,
      addToTransactions: this.viewerAddToTransactions(shares, viewerMemberId),
      paidByMemberId: expense.paidByMemberId,
      paidByDisplayName: expense.paidByMember.displayName,
      createdByUserId: expense.createdByUserId,
      clientMutationId: expense.clientMutationId,
      shares,
      createdAt: expense.createdAt.toISOString(),
    };
  }
}
