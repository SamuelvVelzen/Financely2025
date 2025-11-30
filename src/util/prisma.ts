import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton
 *
 * In development, the Prisma Client extends on hot reload, which can cause
 * issues with too many connections. This singleton pattern ensures we reuse
 * a single Prisma Client instance.
 *
 * Usage:
 * ```ts
 * import { prisma } from "@/util/prisma";
 *
 * const users = await prisma.user.findMany();
 * ```
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Export types and enums for use in server code
export type {
  Currency,
  Tag,
  Transaction,
  TransactionType,
  User,
} from "@prisma/client";
