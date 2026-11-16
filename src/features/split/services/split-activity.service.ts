import { prisma } from "@/features/util/prisma";
import type { Prisma } from "@prisma/client";

type ISplitActivityLogParams = {
  actorMemberId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

export class SplitActivityService {
  static createLogOperation(
    groupId: string,
    params: ISplitActivityLogParams,
    client: Prisma.TransactionClient = prisma,
  ) {
    return client.splitActivity.create({
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

  static async log(
    groupId: string,
    params: ISplitActivityLogParams,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    await this.createLogOperation(groupId, params, tx);
  }
}
