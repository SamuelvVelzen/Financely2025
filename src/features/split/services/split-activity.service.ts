import { prisma } from "@/features/util/prisma";
import type { Prisma } from "@prisma/client";

export class SplitActivityService {
  static async log(
    groupId: string,
    params: {
      actorMemberId?: string | null;
      action: string;
      entityType: string;
      entityId: string;
      before?: unknown;
      after?: unknown;
    },
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    await tx.splitActivity.create({
      data: {
        groupId,
        actorMemberId: params.actorMemberId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeJson: params.before ? JSON.stringify(params.before) : null,
        afterJson: params.after ? JSON.stringify(params.after) : null,
      },
    });
  }
}
