import {
  TripSummaryQuerySchema,
  TripSummarySchema,
  type ITripSummary,
} from "@/features/ledger-account/validation/schemas";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import {
  TransactionType,
  TransferDirection,
  LedgerAccountKind,
} from "@prisma/client";

function sumAmounts(values: number[]): string {
  const total = values.reduce((a, b) => a + b, 0);
  return (Math.round(total * 100) / 100).toFixed(2);
}

export class TripSummaryService {
  static async getSummary(
    userId: string,
    workspaceId: IWorkspaceId,
    query: unknown,
    defaultCurrency: string,
  ): Promise<ITripSummary> {
    const validated = TripSummaryQuerySchema.parse(query);

    const tagFilter =
      validated.tagIds && validated.tagIds.length > 0
        ? {
            OR: [
              { tags: { some: { id: { in: validated.tagIds } } } },
              { primaryTagId: { in: validated.tagIds } },
            ],
          }
        : {};

    const txs = await prisma.transaction.findMany({
      where: {
        userId,
        workspaceId,
        ...(validated.from || validated.to
          ? {
              transactionDate: {
                ...(validated.from ? { gte: new Date(validated.from) } : {}),
                ...(validated.to ? { lte: new Date(validated.to) } : {}),
              },
            }
          : {}),
        ...tagFilter,
        ...(validated.ledgerAccountIds && validated.ledgerAccountIds.length > 0
          ? { ledgerAccountId: { in: validated.ledgerAccountIds } }
          : {}),
      },
      include: {
        expenseRefundAllocations: true,
        ledgerAccount: { select: { kind: true, currency: true } },
      },
    });

    const currency =
      validated.ledgerAccountIds && validated.ledgerAccountIds.length === 1
        ? txs.find((t) => t.ledgerAccount)?.ledgerAccount?.currency ??
          defaultCurrency
        : defaultCurrency;

    const funded: number[] = [];
    const withdrawn: number[] = [];
    const spent: number[] = [];

    for (const tx of txs) {
      const amount = parseFloat(tx.amount.toString());
      if (tx.type === TransactionType.TRANSFER) {
        if (tx.transferDirection === TransferDirection.IN) {
          funded.push(amount);
        }
        if (
          tx.transferDirection === TransferDirection.IN &&
          tx.ledgerAccount?.kind === LedgerAccountKind.CASH
        ) {
          withdrawn.push(amount);
        }
      } else if (tx.type === TransactionType.EXPENSE) {
        const refunded = tx.expenseRefundAllocations.reduce(
          (sum, row) => sum + parseFloat(row.amount.toString()),
          0,
        );
        spent.push(Math.max(0, amount - refunded));
      }
    }

    let cashLeft = 0;
    const cashAccounts = await prisma.ledgerAccount.findMany({
      where: {
        workspaceId,
        workspace: { userId },
        kind: LedgerAccountKind.CASH,
        archivedAt: null,
        ...(validated.ledgerAccountIds && validated.ledgerAccountIds.length > 0
          ? { id: { in: validated.ledgerAccountIds } }
          : {}),
      },
    });

    for (const account of cashAccounts) {
      const accountTxs = await prisma.transaction.findMany({
        where: { ledgerAccountId: account.id, currency: account.currency },
        select: { type: true, transferDirection: true, amount: true },
      });
      let balance = parseFloat(account.openingBalance.toString());
      for (const row of accountTxs) {
        const a = parseFloat(row.amount.toString());
        if (row.type === TransactionType.INCOME) balance += a;
        else if (row.type === TransactionType.EXPENSE) balance -= a;
        else if (row.type === TransactionType.TRANSFER) {
          if (row.transferDirection === TransferDirection.IN) balance += a;
          if (row.transferDirection === TransferDirection.OUT) balance -= a;
        }
      }
      if (account.currency === currency) {
        cashLeft += balance;
      }
    }

    return TripSummarySchema.parse({
      funded: sumAmounts(funded),
      withdrawn: sumAmounts(withdrawn),
      spent: sumAmounts(spent),
      cashLeft: (Math.round(cashLeft * 100) / 100).toFixed(2),
      currency,
    });
  }
}
