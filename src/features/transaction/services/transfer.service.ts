import { LedgerAccountService } from "@/features/ledger-account/services/ledger-account.service";
import {
  CreateLinkedTransferInputSchema,
  type ICreateLinkedTransferInput,
  type ITransaction,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import type { Prisma } from "@prisma/client";
import { TransactionType, TransferDirection } from "@prisma/client";
import { TransactionService } from "./transaction.service";

const TRANSFER_INCLUDE = {
  tags: {
    select: { id: true, name: true, color: true, emoticon: true },
  },
  primaryTag: {
    select: { id: true, name: true, color: true, emoticon: true },
  },
  subscription: {
    select: { id: true, name: true, frequency: true, active: true },
  },
} as const;

function buildTransferName(fromName: string, toName: string): string {
  return `${fromName} → ${toName}`;
}

export class TransferService {
  static async createLinkedTransfer(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ICreateLinkedTransferInput,
  ): Promise<{ outLeg: ITransaction; inLeg: ITransaction }> {
    const validated = CreateLinkedTransferInputSchema.parse(input);
    if (validated.fromLedgerAccountId === validated.toLedgerAccountId) {
      throw new Error("From and to accounts must differ");
    }

    const [fromAccount, toAccount] = await Promise.all([
      LedgerAccountService.getById(
        userId,
        workspaceId,
        validated.fromLedgerAccountId,
      ),
      LedgerAccountService.getById(
        userId,
        workspaceId,
        validated.toLedgerAccountId,
      ),
    ]);

    if (!fromAccount || !toAccount) {
      throw new Error("One or both accounts not found");
    }

    const outAmount = validated.amount;
    const inAmount = validated.receivedAmount ?? validated.amount;
    const inCurrency = validated.receivedCurrency ?? validated.currency;

    if (
      validated.currency === inCurrency &&
      parseFloat(outAmount) !== parseFloat(inAmount)
    ) {
      throw new Error("Amounts must match for same-currency transfers");
    }

    const transferGroupId = crypto.randomUUID();
    const transactionDate = new Date(validated.transactionDate);
    const baseName =
      validated.name?.trim() ||
      buildTransferName(fromAccount.name, toAccount.name);
    const notes = validated.notes ?? null;

    const [outRow, inRow] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          workspaceId,
          type: TransactionType.TRANSFER,
          transferDirection: TransferDirection.OUT,
          transferGroupId,
          ledgerAccountId: validated.fromLedgerAccountId,
          amount: outAmount,
          currency: validated.currency,
          transactionDate,
          timePrecision: "DateOnly",
          name: baseName,
          description: null,
          notes,
          paymentMethod: "BANK_TRANSFER",
        },
        include: TRANSFER_INCLUDE,
      }),
      prisma.transaction.create({
        data: {
          userId,
          workspaceId,
          type: TransactionType.TRANSFER,
          transferDirection: TransferDirection.IN,
          transferGroupId,
          ledgerAccountId: validated.toLedgerAccountId,
          amount: inAmount,
          currency: inCurrency,
          transactionDate,
          timePrecision: "DateOnly",
          name: baseName,
          description: null,
          notes,
          paymentMethod: "BANK_TRANSFER",
        },
        include: TRANSFER_INCLUDE,
      }),
    ]);

    return {
      outLeg: TransactionService.parseTransactionPublic(outRow),
      inLeg: TransactionService.parseTransactionPublic(inRow),
    };
  }

  static async pairExisting(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
    otherTransactionId: string,
  ): Promise<{ a: ITransaction; b: ITransaction }> {
    const [a, b] = await Promise.all([
      prisma.transaction.findFirst({
        where: { id: transactionId, userId, workspaceId },
        include: TRANSFER_INCLUDE,
      }),
      prisma.transaction.findFirst({
        where: { id: otherTransactionId, userId, workspaceId },
        include: TRANSFER_INCLUDE,
      }),
    ]);

    if (!a || !b) {
      throw new Error("One or both transactions not found");
    }
    if (a.id === b.id) {
      throw new Error("Cannot pair a transaction with itself");
    }
    if (a.transferGroupId || b.transferGroupId) {
      throw new Error("One or both transactions are already paired");
    }

    const transferGroupId = crypto.randomUUID();
    const amountA = parseFloat(a.amount.toString());
    const amountB = parseFloat(b.amount.toString());
    if (a.currency === b.currency && amountA !== amountB) {
      throw new Error("Paired amounts must match when currencies match");
    }

    const directionA =
      a.type === TransactionType.INCOME ||
      (a.type === TransactionType.TRANSFER &&
        a.transferDirection === TransferDirection.IN)
        ? TransferDirection.IN
        : TransferDirection.OUT;
    const directionB =
      directionA === TransferDirection.IN
        ? TransferDirection.OUT
        : TransferDirection.IN;

    const [updatedA, updatedB] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: a.id },
        data: {
          type: TransactionType.TRANSFER,
          transferDirection: directionA,
          transferGroupId,
        },
        include: TRANSFER_INCLUDE,
      }),
      prisma.transaction.update({
        where: { id: b.id },
        data: {
          type: TransactionType.TRANSFER,
          transferDirection: directionB,
          transferGroupId,
        },
        include: TRANSFER_INCLUDE,
      }),
    ]);

    return {
      a: TransactionService.parseTransactionPublic(updatedA),
      b: TransactionService.parseTransactionPublic(updatedB),
    };
  }

  static async syncPairedFields(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
    updates: { amount?: string; notes?: string | null },
  ): Promise<void> {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, userId, workspaceId },
    });
    if (!tx?.transferGroupId) {
      return;
    }
    const peers = await prisma.transaction.findMany({
      where: {
        transferGroupId: tx.transferGroupId,
        userId,
        workspaceId,
        id: { not: transactionId },
      },
    });
    for (const peer of peers) {
      const data: Prisma.TransactionUpdateInput = {};
      if (updates.notes !== undefined) {
        data.notes = updates.notes;
      }
      if (updates.amount !== undefined && tx.currency === peer.currency) {
        data.amount = updates.amount;
      }
      if (Object.keys(data).length > 0) {
        await prisma.transaction.update({ where: { id: peer.id }, data });
      }
    }
  }

  static async deletePair(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
    mode: "both" | "unlink",
  ): Promise<void> {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, userId, workspaceId },
    });
    if (!tx) {
      throw new Error("Transaction not found");
    }
    if (!tx.transferGroupId) {
      await prisma.transaction.delete({ where: { id: transactionId } });
      return;
    }

    const peers = await prisma.transaction.findMany({
      where: { transferGroupId: tx.transferGroupId, userId, workspaceId },
    });

    if (mode === "both") {
      await prisma.transaction.deleteMany({
        where: { transferGroupId: tx.transferGroupId, userId, workspaceId },
      });
      return;
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { transferGroupId: null },
    });
    const other = peers.find((p) => p.id !== transactionId);
    if (other) {
      await prisma.transaction.update({
        where: { id: other.id },
        data: { transferGroupId: null },
      });
    }
  }
}

// Expose parse for transfer service (TransactionService.parseTransaction is private)
// We'll add a public static method on TransactionService
