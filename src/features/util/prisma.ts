import type { D1Database } from "@cloudflare/workers-types";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

const prismaContext = new AsyncLocalStorage<PrismaClient>();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createNodePrismaClient(): PrismaClient | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (typeof databaseUrl !== "string" || databaseUrl.length === 0) {
    return undefined;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const nodePrismaClient = globalForPrisma.prisma ?? createNodePrismaClient();

if (nodePrismaClient && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = nodePrismaClient;
}

function resolvePrismaClient(): PrismaClient {
  const fromRequest = prismaContext.getStore();
  if (fromRequest) {
    return fromRequest;
  }
  if (nodePrismaClient) {
    return nodePrismaClient;
  }
  throw new Error(
    "Prisma is not available: set DATABASE_URL for Node/tests or run behind the Cloudflare worker entry (D1 binding DB).",
  );
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = resolvePrismaClient();
    const value = Reflect.get(client, prop, receiver) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

let d1IsolateClient: PrismaClient | undefined;

function getD1PrismaClient(database: D1Database): PrismaClient {
  if (!d1IsolateClient) {
    d1IsolateClient = new PrismaClient({
      adapter: new PrismaD1(database),
      log: ["error"],
    });
  }
  return d1IsolateClient;
}

export function runWithD1Prisma<T>(
  database: D1Database,
  run: () => T | Promise<T>,
): T | Promise<T> {
  const client = getD1PrismaClient(database);
  return prismaContext.run(client, run);
}

// Export types and enums for use in server code
export type { Tag, Transaction, TransactionType, User } from "@prisma/client";
