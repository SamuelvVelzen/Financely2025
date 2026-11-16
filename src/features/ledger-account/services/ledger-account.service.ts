import {
  CashCountInputSchema,
  CreateLedgerAccountInputSchema,
  LedgerAccountSchema,
  UpdateLedgerAccountInputSchema,
  type ICashCountInput,
  type ICreateLedgerAccountInput,
  type ILedgerAccount,
  type IUpdateLedgerAccountInput,
} from "@/features/ledger-account/validation/schemas";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import type { Prisma } from "@prisma/client";
import { TransactionType, TransferDirection } from "@prisma/client";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export class LedgerAccountService {
  private static async computeBalance(
    ledgerAccountId: string,
    openingBalance: Prisma.Decimal,
    currency: string,
  ): Promise<string> {
    const txs = await prisma.transaction.findMany({
      where: { ledgerAccountId },
      select: {
        type: true,
        transferDirection: true,
        amount: true,
        currency: true,
      },
    });

    let balance = parseFloat(openingBalance.toString());
    for (const tx of txs) {
      if (tx.currency !== currency) {
        continue;
      }
      const amount = parseFloat(tx.amount.toString());
      if (tx.type === TransactionType.INCOME) {
        balance += amount;
      } else if (tx.type === TransactionType.EXPENSE) {
        balance -= amount;
      } else if (tx.type === TransactionType.TRANSFER) {
        if (tx.transferDirection === TransferDirection.OUT) {
          balance -= amount;
        } else if (tx.transferDirection === TransferDirection.IN) {
          balance += amount;
        }
      }
    }
    return roundMoney(balance).toFixed(2);
  }

  private static parseRow(
    row: {
      id: string;
      name: string;
      kind: string;
      currency: string;
      openingBalance: Prisma.Decimal;
      openingBalanceDate: Date | null;
      bank: string | null;
      sortOrder: number;
      archivedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    balance?: string,
  ): ILedgerAccount {
    return LedgerAccountSchema.parse({
      id: row.id,
      name: row.name,
      kind: row.kind,
      currency: row.currency,
      openingBalance: row.openingBalance.toString(),
      openingBalanceDate: row.openingBalanceDate?.toISOString() ?? null,
      bank: row.bank,
      sortOrder: row.sortOrder,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      balance,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  static async list(
    userId: string,
    workspaceId: IWorkspaceId,
    options?: { includeArchived?: boolean },
  ): Promise<ILedgerAccount[]> {
    const rows = await prisma.ledgerAccount.findMany({
      where: {
        workspaceId,
        workspace: { userId },
        ...(options?.includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const parsed: ILedgerAccount[] = [];
    for (const row of rows) {
      const balance = await this.computeBalance(
        row.id,
        row.openingBalance,
        row.currency,
      );
      parsed.push(this.parseRow(row, balance));
    }
    return parsed;
  }

  static async getById(
    userId: string,
    workspaceId: IWorkspaceId,
    id: string,
  ): Promise<ILedgerAccount | null> {
    const row = await prisma.ledgerAccount.findFirst({
      where: { id, workspaceId, workspace: { userId } },
    });
    if (!row) return null;
    const balance = await this.computeBalance(
      row.id,
      row.openingBalance,
      row.currency,
    );
    return this.parseRow(row, balance);
  }

  static async create(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ICreateLedgerAccountInput,
  ): Promise<ILedgerAccount> {
    const validated = CreateLedgerAccountInputSchema.parse(input);
    const maxOrder = await prisma.ledgerAccount.aggregate({
      where: { workspaceId },
      _max: { sortOrder: true },
    });
    const row = await prisma.ledgerAccount.create({
      data: {
        workspaceId,
        name: validated.name.trim(),
        kind: validated.kind,
        currency: validated.currency,
        openingBalance: validated.openingBalance ?? "0",
        openingBalanceDate: validated.openingBalanceDate
          ? new Date(validated.openingBalanceDate)
          : null,
        bank: validated.bank ?? null,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    const balance = await this.computeBalance(
      row.id,
      row.openingBalance,
      row.currency,
    );
    return this.parseRow(row, balance);
  }

  static async update(
    userId: string,
    workspaceId: IWorkspaceId,
    id: string,
    input: IUpdateLedgerAccountInput,
  ): Promise<ILedgerAccount> {
    const validated = UpdateLedgerAccountInputSchema.parse(input);
    const existing = await prisma.ledgerAccount.findFirst({
      where: { id, workspaceId, workspace: { userId } },
    });
    if (!existing) {
      throw new Error("Account not found");
    }

    const row = await prisma.ledgerAccount.update({
      where: { id },
      data: {
        ...(validated.name !== undefined && { name: validated.name.trim() }),
        ...(validated.kind !== undefined && { kind: validated.kind }),
        ...(validated.currency !== undefined && {
          currency: validated.currency,
        }),
        ...(validated.openingBalance !== undefined && {
          openingBalance: validated.openingBalance,
        }),
        ...(validated.openingBalanceDate !== undefined && {
          openingBalanceDate: validated.openingBalanceDate
            ? new Date(validated.openingBalanceDate)
            : null,
        }),
        ...(validated.bank !== undefined && { bank: validated.bank ?? null }),
        ...(validated.sortOrder !== undefined && {
          sortOrder: validated.sortOrder,
        }),
        ...(validated.archivedAt !== undefined && {
          archivedAt: validated.archivedAt
            ? new Date(validated.archivedAt)
            : null,
        }),
      },
    });

    const balance = await this.computeBalance(
      row.id,
      row.openingBalance,
      row.currency,
    );
    return this.parseRow(row, balance);
  }

  static async recordCashCount(
    userId: string,
    workspaceId: IWorkspaceId,
    ledgerAccountId: string,
    input: ICashCountInput,
  ): Promise<ILedgerAccount> {
    const validated = CashCountInputSchema.parse(input);
    const account = await this.getById(userId, workspaceId, ledgerAccountId);
    if (!account) {
      throw new Error("Account not found");
    }
    if (account.kind !== "CASH") {
      throw new Error("Cash count is only for cash accounts");
    }

    const expected = parseFloat(account.balance ?? account.openingBalance);
    const actual = parseFloat(validated.actualBalance);
    const diff = roundMoney(actual - expected);

    if (diff !== 0) {
      const isExpense = diff < 0;
      await prisma.transaction.create({
        data: {
          userId,
          workspaceId,
          ledgerAccountId,
          type: isExpense ? TransactionType.EXPENSE : TransactionType.INCOME,
          amount: Math.abs(diff).toFixed(2),
          currency: account.currency,
          transactionDate: new Date(),
          timePrecision: "DateOnly",
          name: validated.note?.trim() || "Unrecorded cash adjustment",
          description: null,
          paymentMethod: "CASH",
        },
      });
    }

    const refreshed = await this.getById(userId, workspaceId, ledgerAccountId);
    if (!refreshed) {
      throw new Error("Account not found");
    }
    return refreshed;
  }

  static async assertOwnedAccount(
    userId: string,
    workspaceId: IWorkspaceId,
    ledgerAccountId: string,
  ): Promise<void> {
    const n = await prisma.ledgerAccount.count({
      where: { id: ledgerAccountId, workspaceId, workspace: { userId } },
    });
    if (n === 0) {
      throw new Error("Ledger account not found");
    }
  }
}
