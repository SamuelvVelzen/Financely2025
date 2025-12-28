import {
  BulkCreateTransactionInputSchema,
  CreateTransactionInputSchema,
  ITransaction,
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
import { prisma } from "@/features/util/prisma";
import { Prisma } from "@prisma/client";

/**
 * Transaction Service
 * Handles transaction-related business logic and data access
 */
export class TransactionService {
  /**
   * List transactions with pagination, filtering, and sorting
   */
  static async listTransactions(
    userId: string,
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
    } = validated;

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(from || to
        ? {
            occurredAt: {
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
    };

    // Parse sort
    const [sortField, sortDirection] = sort?.split(":") ?? [
      "occurredAt",
      "desc",
    ];
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
    if (sortField === "occurredAt") {
      orderBy.occurredAt = sortDirection === "asc" ? "asc" : "desc";
    } else if (sortField === "amount") {
      orderBy.amount = sortDirection === "asc" ? "asc" : "desc";
    } else if (sortField === "name") {
      orderBy.name = sortDirection === "asc" ? "asc" : "desc";
    } else if (sortField === "primaryTag") {
      orderBy.primaryTag = {
        name: sortDirection === "asc" ? "asc" : "desc",
      };
    } else {
      orderBy.occurredAt = "desc";
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get paginated results
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        primaryTag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Map to DTOs
    const data: ITransaction[] = transactions.map((tx) =>
      TransactionSchema.parse({
        id: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        currency: tx.currency,
        occurredAt: tx.occurredAt.toISOString(),
        name: tx.name,
        description: tx.description,
        externalId: tx.externalId,
        paymentMethod: tx.paymentMethod,
        tags: tx.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
        })),
        primaryTag: tx.primaryTag
          ? {
              id: tx.primaryTag.id,
              name: tx.primaryTag.name,
              color: tx.primaryTag.color,
            }
          : null,
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString(),
      })
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
    transactionId: string
  ): Promise<ITransaction | null> {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        primaryTag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!transaction) {
      return null;
    }

    return TransactionSchema.parse({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      occurredAt: transaction.occurredAt.toISOString(),
      name: transaction.name,
      description: transaction.description,
      externalId: transaction.externalId,
      paymentMethod: transaction.paymentMethod,
      tags: transaction.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
      primaryTag: transaction.primaryTag
        ? {
            id: transaction.primaryTag.id,
            name: transaction.primaryTag.name,
            color: transaction.primaryTag.color,
          }
        : null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    });
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(
    userId: string,
    input: ICreateTransactionInput
  ): Promise<ITransaction> {
    const validated = CreateTransactionInputSchema.parse(input);

    // Verify tags belong to user
    if (validated.tagIds && validated.tagIds.length > 0) {
      const tagCount = await prisma.tag.count({
        where: {
          id: { in: validated.tagIds },
          userId,
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

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: validated.type,
        amount: validated.amount,
        currency: validated.currency,
        occurredAt: new Date(validated.occurredAt),
        name: validated.name,
        description: validated.description ?? null,
        notes: validated.notes ?? null,
        externalId: validated.externalId ?? null,
        paymentMethod: validated.paymentMethod,
        primaryTagId: validated.primaryTagId ?? null,
        tags: validated.tagIds
          ? {
              connect: validated.tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        primaryTag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return TransactionSchema.parse({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      occurredAt: transaction.occurredAt.toISOString(),
      name: transaction.name,
      description: transaction.description,
      externalId: transaction.externalId,
      paymentMethod: transaction.paymentMethod,
      tags: transaction.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
      primaryTag: transaction.primaryTag
        ? {
            id: transaction.primaryTag.id,
            name: transaction.primaryTag.name,
            color: transaction.primaryTag.color,
          }
        : null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    });
  }

  /**
   * Bulk create transactions
   * Processes each transaction individually to allow partial success
   * Returns created transactions and errors with indices
   */
  static async bulkCreateTransactions(
    userId: string,
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
              message: "Primary tag transaction type does not match transaction type",
            });
            continue;
          }
        }

        // Create the transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId,
            type: validatedItem.type,
            amount: validatedItem.amount,
            currency: validatedItem.currency,
            occurredAt: new Date(validatedItem.occurredAt),
            name: validatedItem.name,
            description: validatedItem.description ?? null,
            notes: validatedItem.notes ?? null,
            externalId: validatedItem.externalId ?? null,
            paymentMethod: validatedItem.paymentMethod,
            primaryTagId: validatedItem.primaryTagId ?? null,
            tags: validatedItem.tagIds
              ? {
                  connect: validatedItem.tagIds.map((id) => ({ id })),
                }
              : undefined,
          },
          include: {
            tags: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            primaryTag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        });

        const createdTransaction = TransactionSchema.parse({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount.toString(),
          currency: transaction.currency,
          occurredAt: transaction.occurredAt.toISOString(),
          name: transaction.name,
          description: transaction.description,
          externalId: transaction.externalId,
          paymentMethod: transaction.paymentMethod,
          tags: transaction.tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
          })),
          primaryTag: transaction.primaryTag
            ? {
                id: transaction.primaryTag.id,
                name: transaction.primaryTag.name,
                color: transaction.primaryTag.color,
              }
            : null,
          createdAt: transaction.createdAt.toISOString(),
          updatedAt: transaction.updatedAt.toISOString(),
        });

        created.push(createdTransaction);
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
    transactionId: string,
    input: IUpdateTransactionInput
  ): Promise<ITransaction> {
    // Verify transaction belongs to user
    const existing = await this.getTransactionById(userId, transactionId);
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
          },
        });

        if (!primaryTag) {
          throw new Error("Primary tag not found");
        }

        // Get transaction type (use validated type if updating, otherwise use existing)
        const transactionType =
          validated.type ?? existing.type;

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

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(validated.type && { type: validated.type }),
        ...(validated.amount && { amount: validated.amount }),
        ...(validated.currency && { currency: validated.currency }),
        ...(validated.occurredAt && {
          occurredAt: new Date(validated.occurredAt),
        }),
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
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        primaryTag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return TransactionSchema.parse({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      occurredAt: transaction.occurredAt.toISOString(),
      name: transaction.name,
      description: transaction.description,
      externalId: transaction.externalId,
      paymentMethod: transaction.paymentMethod,
      tags: transaction.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
      primaryTag: transaction.primaryTag
        ? {
            id: transaction.primaryTag.id,
            name: transaction.primaryTag.name,
            color: transaction.primaryTag.color,
          }
        : null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    });
  }

  /**
   * Delete transaction
   */
  static async deleteTransaction(
    userId: string,
    transactionId: string
  ): Promise<void> {
    // Verify transaction belongs to user
    const existing = await this.getTransactionById(userId, transactionId);
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
    transactionId: string,
    tagId: string
  ): Promise<ITransaction> {
    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
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
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return TransactionSchema.parse({
      id: updated.id,
      type: updated.type,
      amount: updated.amount.toString(),
      currency: updated.currency,
      occurredAt: updated.occurredAt.toISOString(),
      name: updated.name,
      description: updated.description,
      externalId: updated.externalId,
      paymentMethod: updated.paymentMethod,
      tags: updated.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  }

  /**
   * Remove tag from transaction
   */
  static async removeTagFromTransaction(
    userId: string,
    transactionId: string,
    tagId: string
  ): Promise<ITransaction> {
    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
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
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return TransactionSchema.parse({
      id: updated.id,
      type: updated.type,
      amount: updated.amount.toString(),
      currency: updated.currency,
      occurredAt: updated.occurredAt.toISOString(),
      name: updated.name,
      description: updated.description,
      externalId: updated.externalId,
      paymentMethod: updated.paymentMethod,
      tags: updated.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  }
}
