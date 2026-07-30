import {
  TransactionRefundAllocationSchema,
  type ITransactionRefundAllocation,
} from "@/features/shared/validation/schemas";
import { TransactionType } from "@prisma/client";

const ALLOCATION_TX_SELECT = {
  id: true,
  name: true,
  amount: true,
  currency: true,
  transactionDate: true,
  type: true,
} as const;

export const TRANSACTION_REFUND_ALLOCATION_INCLUDE = {
  refundAllocations: {
    include: {
      expenseTransaction: { select: ALLOCATION_TX_SELECT },
    },
  },
  expenseRefundAllocations: {
    include: {
      refundTransaction: { select: ALLOCATION_TX_SELECT },
    },
  },
} as const;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toDecimalString(value: number): string {
  return roundMoney(value).toString();
}

function parseAllocation(row: {
  id: string;
  refundTransactionId: string;
  expenseTransactionId: string;
  amount: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  expenseTransaction?: {
    id: string;
    name: string;
    amount: { toString(): string };
    currency: string;
    transactionDate: Date;
    type: string;
  } | null;
  refundTransaction?: {
    id: string;
    name: string;
    amount: { toString(): string };
    currency: string;
    transactionDate: Date;
    type: string;
  } | null;
}): ITransactionRefundAllocation {
  return TransactionRefundAllocationSchema.parse({
    id: row.id,
    refundTransactionId: row.refundTransactionId,
    expenseTransactionId: row.expenseTransactionId,
    amount: row.amount.toString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    expenseTransaction: row.expenseTransaction
      ? {
          id: row.expenseTransaction.id,
          name: row.expenseTransaction.name,
          amount: row.expenseTransaction.amount.toString(),
          currency: row.expenseTransaction.currency,
          transactionDate: row.expenseTransaction.transactionDate.toISOString(),
          type: row.expenseTransaction.type,
        }
      : undefined,
    refundTransaction: row.refundTransaction
      ? {
          id: row.refundTransaction.id,
          name: row.refundTransaction.name,
          amount: row.refundTransaction.amount.toString(),
          currency: row.refundTransaction.currency,
          transactionDate: row.refundTransaction.transactionDate.toISOString(),
          type: row.refundTransaction.type,
        }
      : undefined,
  });
}

export type IAllocationParseInput = {
  refundAllocations?: Array<{
    id: string;
    refundTransactionId: string;
    expenseTransactionId: string;
    amount: { toString(): string };
    createdAt: Date;
    updatedAt: Date;
    expenseTransaction?: {
      id: string;
      name: string;
      amount: { toString(): string };
      currency: string;
      transactionDate: Date;
      type: string;
    } | null;
  }>;
  expenseRefundAllocations?: Array<{
    id: string;
    refundTransactionId: string;
    expenseTransactionId: string;
    amount: { toString(): string };
    createdAt: Date;
    updatedAt: Date;
    refundTransaction?: {
      id: string;
      name: string;
      amount: { toString(): string };
      currency: string;
      transactionDate: Date;
      type: string;
    } | null;
  }>;
  amount: { toString(): string } | string;
  type: string;
};

export function parseAllocationsForTransaction(tx: IAllocationParseInput): {
  refundAllocations: ITransactionRefundAllocation[];
  expenseRefundAllocations: ITransactionRefundAllocation[];
  refundRemaining?: string;
  expenseNet?: string;
} {
  const refundAllocations = (tx.refundAllocations ?? []).map(parseAllocation);
  const expenseRefundAllocations = (tx.expenseRefundAllocations ?? []).map(
    parseAllocation,
  );
  const amount = parseFloat(tx.amount.toString());

  if (tx.type === TransactionType.INCOME) {
    const allocated = refundAllocations.reduce(
      (sum, a) => sum + parseFloat(a.amount),
      0,
    );
    return {
      refundAllocations,
      expenseRefundAllocations,
      refundRemaining: toDecimalString(Math.max(0, amount - allocated)),
    };
  }

  if (tx.type === TransactionType.EXPENSE) {
    const refunded = expenseRefundAllocations.reduce(
      (sum, a) => sum + parseFloat(a.amount),
      0,
    );
    return {
      refundAllocations,
      expenseRefundAllocations,
      expenseNet: toDecimalString(Math.max(0, amount - refunded)),
    };
  }

  return { refundAllocations, expenseRefundAllocations };
}

export { roundMoney, toDecimalString };
