import { createId } from "@paralleldrive/cuid2";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/features/util/prisma";

export function newEntityId(): string {
  return createId();
}

type BatchOperation = Prisma.PrismaPromise<unknown>;

export async function runPrismaBatch(
  operations: BatchOperation[],
): Promise<unknown[]> {
  if (operations.length === 0) {
    return [];
  }
  if (operations.length === 1) {
    return [await operations[0]];
  }
  return prisma.$transaction(operations);
}
