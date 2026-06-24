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
import { MessageService } from "@/features/message/services/message.service";
import { SubscriptionDetectionService } from "@/features/subscription/services/subscription-detection.service";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { Prisma } from "@prisma/client";

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
} as const;

/**
 * Transaction Service
 * Handles transaction-related business logic and data access
 */
export class TransactionService {
  private static parseTransaction(tx: {
    id: string;
    type: string;
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
    createdAt: Date;
    updatedAt: Date;
  }): ITransaction {
    const tags = tx.tags ?? [];
    return TransactionSchema.parse({
      id: tx.id,
      type: tx.type,
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
            tags: {
              some: {
                id: { in: tagIds },
              },
            },
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

      // Validate transaction type match: tag.transactionType must be null (works with both) or match transaction type
      if (
        primaryTag.transactionType !== null &&
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

    // Try to auto-flag to an existing subscription
    const autoFlagSubId = await SubscriptionService.tryAutoFlag(
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
    if (!autoFlagSubId) {
      this.triggerDetectionForTransaction(userId, workspaceId, transaction.id).catch(
        () => {},
      );
    }

    return this.parseTransaction(transaction);
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
      await MessageService.createMessage(userId, workspaceId, {
        title: "Recurring transaction detected",
        content: `"${candidate.displayName}" looks like a ${candidate.frequency} subscription (${candidate.occurrences} occurrences). Would you like to track it?`,
        type: "INFO",
        actions: [
          {
            label: "Review Subscriptions",
            type: "navigate",
            path: `/${workspaceId}/subscriptions`,
            variant: "primary",
          },
          { label: "Dismiss", type: "dismiss" },
        ],
        relatedType: "subscription",
      });
    }
  }

  /**
   * Bulk create transactions
   * Processes each transaction individually to allow partial success
   * Returns created transactions and errors with indices
   */
  static async bulkCreateTransactions(
    userId: string,
    workspaceId: IWorkspaceId,
    input: IBulkCreateTransactionInput
  ): Promise<IBulkCreateTransactionResponse> {
    const validated = BulkCreateTransactionInputSchema.parse(input);

    const created: ITransaction[] = [];
    const errors: Array<{ index: number; message: string }> = [];

    for (let index = 0; index < validated.length; index++) {
      const item = validated[index];

      try {
        // Validate individual item
        const validatedItem = CreateTransactionInputSchema.parse(item);

        // Verify tags belong to user
        if (validatedItem.tagIds && validatedItem.tagIds.length > 0) {
          const tagCount = await prisma.tag.count({
            where: {
              id: { in: validatedItem.tagIds },
              userId,
              workspaceId,
            },
          });

          if (tagCount !== validatedItem.tagIds.length) {
            errors.push({
              index,
              message: "One or more tags not found",
            });
            continue;
          }
        }

        // Verify primaryTagId belongs to user and matches transaction type
        if (validatedItem.primaryTagId) {
          const primaryTag = await prisma.tag.findFirst({
            where: {
              id: validatedItem.primaryTagId,
              userId,
              workspaceId,
            },
          });

          if (!primaryTag) {
            errors.push({
              index,
              message: "Primary tag not found",
            });
            continue;
          }

          // Validate transaction type match
          if (
            primaryTag.transactionType !== null &&
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

        // Determine timePrecision and transactionDate (same logic as createTransaction)
        const timePrecision =
          validatedItem.timePrecision ??
          (validatedItem.externalId ? "DateTime" : "DateOnly");

        // Parse transactionDate and normalize based on precision
        const transactionDate = new Date(validatedItem.transactionDate);

        // Validate: if DateOnly, ensure time is placeholder
        if (timePrecision === "DateOnly") {
          const timeStr = transactionDate.toISOString().split("T")[1];
          if (timeStr !== "12:00:00.000Z") {
            transactionDate.setUTCHours(12, 0, 0, 0);
          }
        }

        const autoFlagSubId = await SubscriptionService.tryAutoFlag(
          userId,
          workspaceId,
          validatedItem.name,
          validatedItem.type,
          validatedItem.currency,
          validatedItem.amount,
        );

        const transaction = await prisma.transaction.create({
          data: {
            userId,
            workspaceId,
            type: validatedItem.type,
            amount: validatedItem.amount,
            currency: validatedItem.currency,
            transactionDate,
            timePrecision,
            name: validatedItem.name,
            description: validatedItem.description ?? null,
            notes: validatedItem.notes ?? null,
            externalId: validatedItem.externalId ?? null,
            paymentMethod: validatedItem.paymentMethod,
            primaryTagId: validatedItem.primaryTagId ?? null,
            subscriptionId: autoFlagSubId,
            tags: validatedItem.tagIds
              ? {
                  connect: validatedItem.tagIds.map((id) => ({ id })),
                }
              : undefined,
          },
          include: TRANSACTION_INCLUDE,
        });

        created.push(this.parseTransaction(transaction));
      } catch (error) {
        // Handle validation errors or other errors
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        errors.push({
          index,
          message,
        });
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
            await MessageService.createMessage(userId, workspaceId, {
              title: "Recurring transactions detected",
              content: `We found ${candidates.length} potential subscription${candidates.length > 1 ? "s" : ""} in your imported transactions. Review them to start tracking.`,
              type: "INFO",
              actions: [
                {
                  label: "Review Subscriptions",
                  type: "navigate",
                  path: `/${workspaceId}/subscriptions`,
                  variant: "primary",
                },
                { label: "Dismiss", type: "dismiss" },
              ],
              relatedType: "subscription",
            });
          }
        })
        .catch(() => {});
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

    const validated = UpdateTransactionInputSchema.parse(input);

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

        // Validate transaction type match
        if (
          primaryTag.transactionType !== null &&
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

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: TRANSACTION_INCLUDE,
    });

    return this.parseTransaction(transaction);
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

    await prisma.transaction.delete({
      where: { id: transactionId },
    });
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
