import {
  BulkCreateTransactionInputSchema,
  CreateTransactionInputSchema,
  type ITransaction,
  PaginatedTransactionsResponseSchema,
  TransactionSchema,
  TransactionsQuerySchema,
  UpdateTransactionInputSchema,
  type IBulkCreateTransactionInput,
  type IBulkCreateTransactionResponse,
  type ICreateTransactionInput,
  type IPaginatedTransactionsResponse,
  type ITransactionsQuery,
  type IUpdateTransactionInput,
} from "@/features/shared/validation/schemas";
import { notifyBudgetThresholdsIfNeeded } from "@/features/notification/services/notify-budget-thresholds";
import { NotificationService } from "@/features/notification/services/notification.service";
import { NOTIFICATION_RELATED_TYPE } from "@/features/notification/utils/notification-related-type";
import { SubscriptionDetectionService } from "@/features/subscription/services/subscription-detection.service";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { Prisma } from "@prisma/client";
import {
  parseAllocationsForTransaction,
  TRANSACTION_REFUND_ALLOCATION_INCLUDE,
  type IAllocationParseInput,
} from "./refund-allocation-helpers";
import { LedgerAccountService } from "@/features/ledger-account/services/ledger-account.service";
import {
  BulkUpdateTransactionTypeInputSchema,
  type IBulkUpdateTransactionTypeInput,
} from "@/features/transaction/validation/schemas";
import {
  assertCreateTransferFields,
  assertUpdateTransferFields,
} from "./transaction-transfer-validation";
import { TransferService } from "./transfer.service";

/** Chunk size for bulk transaction creates (CSV import / bulk API). */
export const BATCH_SIZE = 100;

const TRANSACTION_INCLUDE = {
  tags: {
    select: { id: true, name: true, color: true, emoticon: true },
  },
  primaryTag: {
    select: { id: true, name: true, color: true, emoticon: true },
  },
  subscription: {
    select: { id: true, name: true, frequency: true, active: true },
  },
  ...TRANSACTION_REFUND_ALLOCATION_INCLUDE,
} as const;

/**
 * Transaction Service
 * Handles transaction-related business logic and data access
 */
export class TransactionService {
  static parseTransactionPublic(
    tx: Parameters<typeof TransactionService.parseTransaction>[0],
  ): ITransaction {
    return this.parseTransaction(tx);
  }

  private static parseTransaction(tx: {
    id: string;
    type: string;
    transferDirection?: string | null;
    transferGroupId?: string | null;
    ledgerAccountId?: string | null;
    amount: { toString(): string };
    currency: string;
    transactionDate: Date;
    timePrecision: string;
    name: string;
    description: string | null;
    externalId: string | null;
    paymentMethod: string;
    tags?: Array<{
      id: string;
      name: string;
      color: string | null;
      emoticon: string | null;
    }>;
    primaryTag?: {
      id: string;
      name: string;
      color: string | null;
      emoticon: string | null;
    } | null;
    subscription?: {
      id: string;
      name: string;
      frequency: string;
      active: boolean;
    } | null;
    refundAllocations?: IAllocationParseInput["refundAllocations"];
    expenseRefundAllocations?: IAllocationParseInput["expenseRefundAllocations"];
    createdAt: Date;
    updatedAt: Date;
  }): ITransaction {
    const tags = tx.tags ?? [];
    const allocationFields = parseAllocationsForTransaction(tx);
    return TransactionSchema.parse({
      id: tx.id,
      type: tx.type,
      transferDirection: tx.transferDirection ?? null,
      transferGroupId: tx.transferGroupId ?? null,
      ledgerAccountId: tx.ledgerAccountId ?? null,
      amount: tx.amount.toString(),
      currency: tx.currency,
      transactionDate: tx.transactionDate.toISOString(),
      timePrecision: tx.timePrecision,
      name: tx.name,
      description: tx.description,
      externalId: tx.externalId,
      paymentMethod: tx.paymentMethod,
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        emoticon: tag.emoticon,
      })),
      primaryTag: tx.primaryTag
        ? {
            id: tx.primaryTag.id,
            name: tx.primaryTag.name,
            color: tx.primaryTag.color,
            emoticon: tx.primaryTag.emoticon,
          }
        : null,
      subscription: tx.subscription
        ? {
            id: tx.subscription.id,
            name: tx.subscription.name,
            frequency: tx.subscription.frequency,
            active: tx.subscription.active,
          }
        : null,
      ...allocationFields,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
    });
  }

  /**
   * List transactions with pagination, filtering, and sorting
   */
  static async listTransactions(
    userId: string,
    workspaceId: IWorkspaceId,
    query: ITransactionsQuery
  ): Promise<IPaginatedTransactionsResponse> {
    const validated = TransactionsQuerySchema.parse(query);
    const {
      page,
      limit,
      from,
      to,
      type,
      tagIds,
      q,
      sort,
      minAmount,
      maxAmount,
      paymentMethod,
      currency,
      ledgerAccountId,
      unassignedLedgerAccount,
    } = validated;

    // Build where clause
    // Use transactionDate for day-based filters (includes both precision types)
    const where: Prisma.TransactionWhereInput = {
      userId,
      workspaceId,
      ...(from || to
        ? {
            transactionDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(type && { type }),
      ...(tagIds && tagIds.length > 0
        ? {
            OR: [
              {
                tags: {
                  some: {
                    id: { in: tagIds },
                  },
                },
              },
              {
                primaryTagId: { in: tagIds },
              },
            ],
          }
        : {}),
      ...(q
        ? {
            OR: [{ name: { contains: q } }, { description: { contains: q } }],
          }
        : {}),
      ...(minAmount || maxAmount
        ? {
            amount: {
              ...(minAmount ? { gte: new Prisma.Decimal(minAmount) } : {}),
              ...(maxAmount ? { lte: new Prisma.Decimal(maxAmount) } : {}),
            },
          }
        : {}),
      ...(paymentMethod && paymentMethod.length > 0
        ? { paymentMethod: { in: paymentMethod } }
        : {}),
      ...(currency && currency.length > 0
        ? { currency: { in: currency } }
        : {}),
      ...(ledgerAccountId ? { ledgerAccountId } : {}),
      ...(unassignedLedgerAccount ? { ledgerAccountId: null } : {}),
    };

    // Parse sort
    // For transactionDate sorting, use precision-aware logic:
    // Primary: transactionDate (calendar day)
    // Secondary: transactionDate time for DateTime, createdAt for DateOnly
    const [sortField, sortDirection] = sort?.split(":") ?? [
      "transactionDate",
      "desc",
    ];
    const orderBy: Prisma.TransactionOrderByWithRelationInput[] = [];

    if (sortField === "transactionDate") {
      // Primary sort by transactionDate (calendar day)
      orderBy.push({
        transactionDate: sortDirection === "asc" ? "asc" : "desc",
      });
    } else if (sortField === "amount") {
      orderBy.push({
        amount: sortDirection === "asc" ? "asc" : "desc",
      });
    } else if (sortField === "name") {
      orderBy.push({
        name: sortDirection === "asc" ? "asc" : "desc",
      });
    } else if (sortField === "primaryTag") {
      orderBy.push({
        primaryTag: {
          name: sortDirection === "asc" ? "asc" : "desc",
        },
      });
    } else {
      orderBy.push({
        transactionDate: "desc",
      });
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get paginated results
    // Use Prisma's orderBy (transactionDate primary)
    // For precision-aware sorting within same day, we'll handle in post-processing if needed
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: orderBy.length === 1 ? orderBy[0] : orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: TRANSACTION_INCLUDE,
    });

    const data: ITransaction[] = transactions.map((tx) =>
      this.parseTransaction(tx)
    );

    return PaginatedTransactionsResponseSchema.parse({
      data,
      page,
      limit,
      total,
      hasNext: page * limit < total,
    });
  }

  /**
   * Get transaction by ID (user-scoped)
   */
  static async getTransactionById(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string
  ): Promise<ITransaction | null> {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId, workspaceId },
      include: TRANSACTION_INCLUDE,
    });

    if (!transaction) {
      return null;
    }

    return this.parseTransaction(transaction);
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ICreateTransactionInput
  ): Promise<ITransaction> {
    const validated = CreateTransactionInputSchema.parse(input);
    assertCreateTransferFields(validated);

    if (validated.ledgerAccountId) {
      await LedgerAccountService.assertOwnedAccount(
        userId,
        workspaceId,
        validated.ledgerAccountId,
      );
    }

    // Verify tags belong to user
    if (validated.tagIds && validated.tagIds.length > 0) {
      const tagCount = await prisma.tag.count({
        where: {
          id: { in: validated.tagIds },
          userId,
          workspaceId,
        },
      });

      if (tagCount !== validated.tagIds.length) {
        throw new Error("One or more tags not found");
      }
    }

    // Verify primaryTagId belongs to user and matches transaction type
    if (validated.primaryTagId) {
      const primaryTag = await prisma.tag.findFirst({
        where: {
          id: validated.primaryTagId,
          userId,
          workspaceId,
        },
      });

      if (!primaryTag) {
        throw new Error("Primary tag not found");
      }

      if (
        validated.type !== "TRANSFER" &&
        primaryTag.transactionType !== validated.type
      ) {
        throw new Error(
          "Primary tag transaction type does not match transaction type"
        );
      }
    }

    // Determine timePrecision: use provided value, or default based on context
    // For manual entry (no externalId), default to DateOnly
    // For API/import, default to DateTime
    const timePrecision =
      validated.timePrecision ??
      (validated.externalId ? "DateTime" : "DateOnly");

    // Parse transactionDate and normalize based on precision
    const transactionDate = new Date(validated.transactionDate);

    // Validate: if DateOnly, ensure time is placeholder (noon UTC)
    if (timePrecision === "DateOnly") {
      const timeStr = transactionDate.toISOString().split("T")[1];
      // Check if time is not noon UTC (12:00:00.000Z)
      if (timeStr !== "12:00:00.000Z") {
        transactionDate.setUTCHours(12, 0, 0, 0);
      }
    }

    const autoFlagSubId =
      validated.type === "TRANSFER"
        ? null
        : await SubscriptionService.tryAutoFlag(
            userId,
            workspaceId,
            validated.name,
            validated.type,
            validated.currency,
            validated.amount,
          );

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        workspaceId,
        type: validated.type,
        transferDirection:
          validated.type === "TRANSFER"
            ? validated.transferDirection ?? null
            : null,
        transferGroupId: validated.transferGroupId ?? null,
        ledgerAccountId: validated.ledgerAccountId ?? null,
        amount: validated.amount,
        currency: validated.currency,
        transactionDate,
        timePrecision,
        name: validated.name,
        description: validated.description ?? null,
        notes: validated.notes ?? null,
        externalId: validated.externalId ?? null,
        paymentMethod: validated.paymentMethod,
        primaryTagId: validated.primaryTagId ?? null,
        subscriptionId: autoFlagSubId,
        tags: validated.tagIds
          ? {
              connect: validated.tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: TRANSACTION_INCLUDE,
    });

    // If not auto-flagged, check if this transaction forms a new subscription pattern
    if (!autoFlagSubId && validated.type !== "TRANSFER") {
      this.triggerDetectionForTransaction(userId, workspaceId, transaction.id).catch(
        () => {},
      );
    }

    if (validated.type === "EXPENSE") {
      this.triggerBudgetThresholdCheck(userId, workspaceId);
    }

    return this.parseTransaction(transaction);
  }

  /**
   * Fire-and-forget budget near/over notifications after expense writes.
   */
  private static triggerBudgetThresholdCheck(
    userId: string,
    workspaceId: IWorkspaceId,
  ): void {
    void notifyBudgetThresholdsIfNeeded(userId, workspaceId).catch(() => {});
  }

  /**
   * Fire-and-forget detection for a newly created transaction.
   * If a subscription pattern is found, creates an in-app message.
   */
  private static async triggerDetectionForTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
  ): Promise<void> {
    const candidates =
      await SubscriptionDetectionService.detectForTransaction(
        userId,
        workspaceId,
        transactionId,
      );

    if (candidates.length > 0) {
      const candidate = candidates[0];
      await NotificationService.createNotification(userId, workspaceId, {
        title: "Recurring transaction detected",
        content: `"${candidate.displayName}" looks like a ${candidate.frequency} subscription (${candidate.occurrences} occurrences). Would you like to track it?`,
        type: "INFO",
        relatedType: NOTIFICATION_RELATED_TYPE.subscription,
      });
    }
  }

  /**
   * Bulk create transactions
   * Prefetches tags/subscriptions, validates in memory, then inserts in chunks
   * to allow partial success while avoiding N+1 queries.
   */
  static async bulkCreateTransactions(
    userId: string,
    workspaceId: IWorkspaceId,
    input: IBulkCreateTransactionInput
  ): Promise<IBulkCreateTransactionResponse> {
    const validated = BulkCreateTransactionInputSchema.parse(input);

    const created: ITransaction[] = [];
    const errors: Array<{ index: number; message: string }> = [];

    type IPreparedItem = {
      index: number;
      validatedItem: ICreateTransactionInput;
      timePrecision: "DateTime" | "DateOnly";
      transactionDate: Date;
      subscriptionId: string | null;
    };

    const prepared: IPreparedItem[] = [];

    // Collect unique tag IDs for one prefetch
    const allTagIds = new Set<string>();
    for (const item of validated) {
      try {
        const validatedItem = CreateTransactionInputSchema.parse(item);
        for (const tagId of validatedItem.tagIds ?? []) {
          allTagIds.add(tagId);
        }
        if (validatedItem.primaryTagId) {
          allTagIds.add(validatedItem.primaryTagId);
        }
      } catch {
        // Individual validation errors handled in the prepare loop below
      }
    }

    const [tags, subscriptions] = await Promise.all([
      allTagIds.size > 0
        ? prisma.tag.findMany({
            where: {
              id: { in: [...allTagIds] },
              userId,
              workspaceId,
            },
            select: {
              id: true,
              transactionType: true,
            },
          })
        : Promise.resolve([]),
      prisma.subscription.findMany({
        where: {
          userId,
          workspaceId,
          active: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          currency: true,
          amount: true,
        },
      }),
    ]);

    const tagById = new Map(tags.map((tag) => [tag.id, tag]));

    for (let index = 0; index < validated.length; index++) {
      const item = validated[index];

      try {
        const validatedItem = CreateTransactionInputSchema.parse(item);

        if (validatedItem.tagIds && validatedItem.tagIds.length > 0) {
          const missingTag = validatedItem.tagIds.some(
            (tagId) => !tagById.has(tagId),
          );
          if (missingTag) {
            errors.push({
              index,
              message: "One or more tags not found",
            });
            continue;
          }
        }

        if (validatedItem.primaryTagId) {
          const primaryTag = tagById.get(validatedItem.primaryTagId);
          if (!primaryTag) {
            errors.push({
              index,
              message: "Primary tag not found",
            });
            continue;
          }

          if (
            validatedItem.type !== "TRANSFER" &&
            primaryTag.transactionType !== validatedItem.type
          ) {
            errors.push({
              index,
              message:
                "Primary tag transaction type does not match transaction type",
            });
            continue;
          }
        }

        const timePrecision =
          validatedItem.timePrecision ??
          (validatedItem.externalId ? "DateTime" : "DateOnly");

        const transactionDate = new Date(validatedItem.transactionDate);

        if (timePrecision === "DateOnly") {
          const timeStr = transactionDate.toISOString().split("T")[1];
          if (timeStr !== "12:00:00.000Z") {
            transactionDate.setUTCHours(12, 0, 0, 0);
          }
        }

        const subscriptionId =
          validatedItem.type === "TRANSFER"
            ? null
            : SubscriptionService.matchSubscriptionId(
                subscriptions,
                validatedItem.name,
                validatedItem.type,
                validatedItem.currency,
                validatedItem.amount,
              );

        prepared.push({
          index,
          validatedItem,
          timePrecision,
          transactionDate,
          subscriptionId,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        errors.push({
          index,
          message,
        });
      }
    }

    const createFromPrepared = (item: IPreparedItem) =>
      prisma.transaction.create({
        data: {
          userId,
          workspaceId,
          type: item.validatedItem.type,
          transferDirection:
            item.validatedItem.type === "TRANSFER"
              ? item.validatedItem.transferDirection ?? null
              : null,
          transferGroupId: item.validatedItem.transferGroupId ?? null,
          ledgerAccountId: item.validatedItem.ledgerAccountId ?? null,
          amount: item.validatedItem.amount,
          currency: item.validatedItem.currency,
          transactionDate: item.transactionDate,
          timePrecision: item.timePrecision,
          name: item.validatedItem.name,
          description: item.validatedItem.description ?? null,
          notes: item.validatedItem.notes ?? null,
          externalId: item.validatedItem.externalId ?? null,
          paymentMethod: item.validatedItem.paymentMethod,
          primaryTagId: item.validatedItem.primaryTagId ?? null,
          subscriptionId: item.subscriptionId,
          tags: item.validatedItem.tagIds
            ? {
                connect: item.validatedItem.tagIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: TRANSACTION_INCLUDE,
      });

    for (let offset = 0; offset < prepared.length; offset += BATCH_SIZE) {
      const chunk = prepared.slice(offset, offset + BATCH_SIZE);

      try {
        const chunkResults = await prisma.$transaction(
          chunk.map((item) => createFromPrepared(item)),
        );

        for (const transaction of chunkResults) {
          created.push(this.parseTransaction(transaction));
        }
      } catch {
        // Chunk failed as a unit — fall back to per-item creates for partial success
        for (const item of chunk) {
          try {
            const transaction = await createFromPrepared(item);
            created.push(this.parseTransaction(transaction));
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Unknown error occurred";
            errors.push({
              index: item.index,
              message,
            });
          }
        }
      }
    }

    // Run subscription detection for the batch (fire-and-forget)
    if (created.length > 0) {
      const createdIds = created.map((transaction) => transaction.id);
      SubscriptionDetectionService.detectSubscriptions(userId, workspaceId, {
        transactionIds: createdIds,
      })
        .then(async (candidates) => {
          if (candidates.length > 0) {
            await NotificationService.createNotification(userId, workspaceId, {
              title: "Recurring transactions detected",
              content: `We found ${candidates.length} potential subscription${candidates.length > 1 ? "s" : ""} in your imported transactions. Review them to start tracking.`,
              type: "INFO",
              relatedType: NOTIFICATION_RELATED_TYPE.subscription,
            });
          }
        })
        .catch(() => {});

      const createdExpense = created.some(
        (transaction) => transaction.type === "EXPENSE",
      );
      if (createdExpense) {
        this.triggerBudgetThresholdCheck(userId, workspaceId);
      }
    }

    return {
      created,
      errors,
    };
  }

  /**
   * Update transaction
   */
  static async updateTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
    input: IUpdateTransactionInput
  ): Promise<ITransaction> {
    // Verify transaction belongs to user
    const existing = await this.getTransactionById(
      userId,
      workspaceId,
      transactionId
    );
    if (!existing) {
      throw new Error("Transaction not found");
    }

    const splitLink = await prisma.transaction.findFirst({
      where: { id: transactionId },
      select: { splitExpenseShareId: true, splitSyncDetachedAt: true },
    });
    if (splitLink?.splitExpenseShareId && !splitLink.splitSyncDetachedAt) {
      throw new Error("This transaction is managed by a split expense");
    }

    const validated = UpdateTransactionInputSchema.parse(input);
    assertUpdateTransferFields(
      existing.type,
      existing.transferDirection ?? null,
      validated,
    );

    if (validated.ledgerAccountId) {
      await LedgerAccountService.assertOwnedAccount(
        userId,
        workspaceId,
        validated.ledgerAccountId,
      );
    }

    // Verify tags if updating
    if (validated.tagIds) {
      const tagCount = await prisma.tag.count({
        where: {
          id: { in: validated.tagIds },
          userId,
          workspaceId,
        },
      });

      if (tagCount !== validated.tagIds.length) {
        throw new Error("One or more tags not found");
      }
    }

    // Verify primaryTagId if updating
    if (validated.primaryTagId !== undefined) {
      if (validated.primaryTagId !== null) {
        const primaryTag = await prisma.tag.findFirst({
          where: {
            id: validated.primaryTagId,
            userId,
            workspaceId,
          },
        });

        if (!primaryTag) {
          throw new Error("Primary tag not found");
        }

        // Get transaction type (use validated type if updating, otherwise use existing)
        const transactionType = validated.type ?? existing.type;

        if (
          transactionType !== "TRANSFER" &&
          primaryTag.transactionType !== transactionType
        ) {
          throw new Error(
            "Primary tag transaction type does not match transaction type"
          );
        }
      }
    }

    // Handle transactionDate and precision updates
    const updateData: Prisma.TransactionUpdateInput = {
      ...(validated.type && { type: validated.type }),
      ...(validated.transferDirection !== undefined && {
        transferDirection: validated.transferDirection,
      }),
      ...(validated.ledgerAccountId !== undefined && {
        ledgerAccount: validated.ledgerAccountId
          ? { connect: { id: validated.ledgerAccountId } }
          : { disconnect: true },
      }),
      ...(validated.amount && { amount: validated.amount }),
      ...(validated.currency && { currency: validated.currency }),
      ...(validated.name && { name: validated.name }),
      ...(validated.description !== undefined && {
        description: validated.description,
      }),
      ...(validated.notes !== undefined && {
        notes: validated.notes,
      }),
      ...(validated.externalId !== undefined && {
        externalId: validated.externalId,
      }),
      ...(validated.paymentMethod !== undefined && {
        paymentMethod: validated.paymentMethod,
      }),
      ...(validated.tagIds !== undefined && {
        tags: {
          set: validated.tagIds.map((id) => ({ id })),
        },
      }),
      ...(validated.primaryTagId !== undefined && {
        primaryTagId: validated.primaryTagId,
      }),
    };

    // Handle transactionDate and precision updates
    if (validated.transactionDate !== undefined) {
      const transactionDate = new Date(validated.transactionDate);
      const timeStr = transactionDate.toISOString().split("T")[1];

      // Detect if time was set or removed
      // If timePrecision is explicitly provided, use it
      // Otherwise, infer from transactionDate: if time is noon UTC (12:00:00.000Z), it's DateOnly
      let newPrecision = validated.timePrecision;
      if (newPrecision === undefined) {
        // Infer precision from time component
        // Check if time is the placeholder (12:00:00.000Z) or has actual time
        if (timeStr === "12:00:00.000Z") {
          newPrecision = "DateOnly";
          // Normalize to noon UTC
          transactionDate.setUTCHours(12, 0, 0, 0);
        } else {
          newPrecision = "DateTime";
        }
      } else if (newPrecision === "DateOnly") {
        // Normalize to noon UTC for date-only
        transactionDate.setUTCHours(12, 0, 0, 0);
      }

      updateData.transactionDate = transactionDate;
      updateData.timePrecision = newPrecision;
    } else if (validated.timePrecision !== undefined) {
      // Only precision changed, update transactionDate if needed
      if (
        validated.timePrecision === "DateOnly" &&
        existing.timePrecision === "DateTime"
      ) {
        // Switching to DateOnly: normalize transactionDate to noon UTC
        const dateOnly = new Date(existing.transactionDate)
          .toISOString()
          .split("T")[0];
        updateData.transactionDate = new Date(dateOnly + "T12:00:00.000Z");
      }
      updateData.timePrecision = validated.timePrecision;
    }

    const nextType = validated.type ?? existing.type;
    if (nextType !== "TRANSFER") {
      updateData.transferDirection = null;
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: TRANSACTION_INCLUDE,
    });

    if (existing.transferGroupId) {
      await TransferService.syncPairedFields(userId, workspaceId, transactionId, {
        ...(validated.amount ? { amount: validated.amount } : {}),
        ...(validated.notes !== undefined ? { notes: validated.notes } : {}),
      });
    }

    const parsed = this.parseTransaction(transaction);
    const affectsExpenseBudget =
      existing.type === "EXPENSE" || parsed.type === "EXPENSE";
    if (affectsExpenseBudget) {
      this.triggerBudgetThresholdCheck(userId, workspaceId);
    }

    return parsed;
  }

  /**
   * Delete transaction
   */
  static async deleteTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string
  ): Promise<void> {
    // Verify transaction belongs to user
    const existing = await this.getTransactionById(
      userId,
      workspaceId,
      transactionId
    );
    if (!existing) {
      throw new Error("Transaction not found");
    }

    const splitLink = await prisma.transaction.findFirst({
      where: { id: transactionId },
      select: { splitExpenseShareId: true, splitSyncDetachedAt: true },
    });
    if (splitLink?.splitExpenseShareId && !splitLink.splitSyncDetachedAt) {
      throw new Error("This transaction is managed by a split expense");
    }

    if (existing.transferGroupId) {
      await TransferService.deletePair(userId, workspaceId, transactionId, "both");
      return;
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });
  }

  static async bulkUpdateTransactionType(
    userId: string,
    workspaceId: IWorkspaceId,
    input: IBulkUpdateTransactionTypeInput,
  ): Promise<{ updated: number }> {
    const validated = BulkUpdateTransactionTypeInputSchema.parse(input);
    if (validated.type === "TRANSFER") {
      if (
        validated.transferDirection !== "OUT" &&
        validated.transferDirection !== "IN"
      ) {
        throw new Error("transferDirection required when marking as TRANSFER");
      }
    }

    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: validated.transactionIds },
        userId,
        workspaceId,
      },
      data: {
        type: validated.type,
        transferDirection:
          validated.type === "TRANSFER"
            ? validated.transferDirection ?? null
            : null,
        ...(validated.type !== "TRANSFER" ? { transferGroupId: null } : {}),
      },
    });

    return { updated: result.count };
  }

  static async bulkDeleteTransactions(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionIds: string[],
  ): Promise<{ deleted: number; errors: Array<{ id: string; message: string }> }> {
    const uniqueIds = [...new Set(transactionIds)];
    let deleted = 0;
    const errors: Array<{ id: string; message: string }> = [];
    const processedTransferGroups = new Set<string>();

    for (const transactionId of uniqueIds) {
      try {
        const existing = await this.getTransactionById(
          userId,
          workspaceId,
          transactionId,
        );
        if (!existing) {
          continue;
        }
        if (existing.transferGroupId) {
          if (processedTransferGroups.has(existing.transferGroupId)) {
            continue;
          }
          processedTransferGroups.add(existing.transferGroupId);
        }
        await this.deleteTransaction(userId, workspaceId, transactionId);
        deleted += 1;
      } catch (error) {
        errors.push({
          id: transactionId,
          message:
            error instanceof Error ? error.message : "Could not delete transaction",
        });
      }
    }

    return { deleted, errors };
  }

  /**
   * Add tag to transaction
   */
  static async addTagToTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
    tagId: string
  ): Promise<ITransaction> {
    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        workspaceId,
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
        workspaceId,
      },
    });

    if (!tag) {
      throw new Error("Tag not found");
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
      include: TRANSACTION_INCLUDE,
    });

    return this.parseTransaction(updated);
  }

  /**
   * Remove tag from transaction
   */
  static async removeTagFromTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionId: string,
    tagId: string
  ): Promise<ITransaction> {
    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        workspaceId,
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
      include: TRANSACTION_INCLUDE,
    });

    return this.parseTransaction(updated);
  }
}
