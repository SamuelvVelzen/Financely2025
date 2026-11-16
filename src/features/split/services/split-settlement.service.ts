import { prisma } from "@/features/util/prisma";
import { newEntityId, runPrismaBatch } from "@/features/util/prisma-batch";
import type { Prisma } from "@prisma/client";
import {
  canEditSettlement,
  requireActiveMemberForUser,
} from "../auth/split-group-access";
import type {
  ICreateSplitSettlementInput,
  IUpdateSplitSettlementInput,
} from "../validation/schemas";
import { SplitActivityService } from "./split-activity.service";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

type ISplitSettlementWithMemberNames = Prisma.SplitSettlementGetPayload<{
  include: {
    fromMember: { select: { displayName: true } };
    toMember: { select: { displayName: true } };
  };
}>;

export class SplitSettlementService {
  static async listSettlementsForGroup(groupId: string) {
    const settlements = await prisma.splitSettlement.findMany({
      where: { groupId, deletedAt: null },
      include: {
        fromMember: { select: { id: true, displayName: true } },
        toMember: { select: { id: true, displayName: true } },
      },
      orderBy: { settledAt: "desc" },
    });

    return settlements.map((s) => ({
      id: s.id,
      fromMemberId: s.fromMemberId,
      fromDisplayName: s.fromMember.displayName,
      toMemberId: s.toMemberId,
      toDisplayName: s.toMember.displayName,
      amount: s.amount.toString(),
      settledAt: s.settledAt.toISOString(),
      note: s.note,
      createdByUserId: s.createdByUserId,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  static async listSettlements(groupId: string, userId: string) {
    await requireActiveMemberForUser(groupId, userId);
    return this.listSettlementsForGroup(groupId);
  }

  static async createSettlementForMember(
    groupId: string,
    actorMemberId: string,
    createdByUserId: string | null,
    input: ICreateSplitSettlementInput,
  ) {
    if (input.fromMemberId === input.toMemberId) {
      throw new Error("Payer and recipient must be different people");
    }

    const actor = await prisma.splitGroupMember.findFirstOrThrow({
      where: {
        id: actorMemberId,
        groupId,
        status: { in: ["linked", "guest"] },
      },
    });

    if (
      actor.id !== input.fromMemberId &&
      actor.id !== input.toMemberId &&
      actor.role !== "admin"
    ) {
      throw new Error("You must be involved in the settlement");
    }

    const settlementId = newEntityId();
    const [settlement] = (await runPrismaBatch([
      prisma.splitSettlement.create({
        data: {
          id: settlementId,
          groupId,
          fromMemberId: input.fromMemberId,
          toMemberId: input.toMemberId,
          amount: input.amount,
          settledAt: new Date(input.settledAt),
          note: input.note ?? null,
          createdByUserId,
        },
        include: {
          fromMember: { select: { displayName: true } },
          toMember: { select: { displayName: true } },
        },
      }),
      SplitActivityService.createLogOperation(groupId, {
        actorMemberId: actor.id,
        action: "created",
        entityType: "settlement",
        entityId: settlementId,
        after: { amount: input.amount },
      }),
    ])) as [ISplitSettlementWithMemberNames];

    return {
      id: settlement.id,
      fromMemberId: settlement.fromMemberId,
      fromDisplayName: settlement.fromMember.displayName,
      toMemberId: settlement.toMemberId,
      toDisplayName: settlement.toMember.displayName,
      amount: settlement.amount.toString(),
      settledAt: settlement.settledAt.toISOString(),
      note: settlement.note,
    };
  }

  static async createSettlement(
    groupId: string,
    userId: string,
    input: ICreateSplitSettlementInput,
  ) {
    const member = await requireActiveMemberForUser(groupId, userId);
    return this.createSettlementForMember(groupId, member.id, userId, input);
  }

  static async updateSettlement(
    settlementId: string,
    userId: string,
    input: IUpdateSplitSettlementInput,
  ) {
    const settlement = await prisma.splitSettlement.findFirstOrThrow({
      where: { id: settlementId, deletedAt: null },
    });

    const member = await requireActiveMemberForUser(settlement.groupId, userId);

    if (!canEditSettlement(member, settlement, userId)) {
      throw new Error("Not allowed to edit this settlement");
    }

    const fromMemberId = input.fromMemberId ?? settlement.fromMemberId;
    const toMemberId = input.toMemberId ?? settlement.toMemberId;

    if (fromMemberId === toMemberId) {
      throw new Error("Payer and recipient must be different people");
    }

    if (
      member.role !== "admin" &&
      member.id !== fromMemberId &&
      member.id !== toMemberId
    ) {
      throw new Error("You must be involved in the settlement");
    }

    const [updated] = (await runPrismaBatch([
      prisma.splitSettlement.update({
        where: { id: settlementId },
        data: {
          fromMemberId,
          toMemberId,
          amount: input.amount ?? settlement.amount,
          settledAt: input.settledAt
            ? new Date(input.settledAt)
            : settlement.settledAt,
          note: input.note !== undefined ? input.note : settlement.note,
        },
        include: {
          fromMember: { select: { displayName: true } },
          toMember: { select: { displayName: true } },
        },
      }),
      SplitActivityService.createLogOperation(settlement.groupId, {
        actorMemberId: member.id,
        action: "updated",
        entityType: "settlement",
        entityId: settlementId,
        after: {
          amount: (input.amount ?? settlement.amount).toString(),
        },
      }),
    ])) as [ISplitSettlementWithMemberNames];

    return {
      id: updated.id,
      fromMemberId: updated.fromMemberId,
      fromDisplayName: updated.fromMember.displayName,
      toMemberId: updated.toMemberId,
      toDisplayName: updated.toMember.displayName,
      amount: updated.amount.toString(),
      settledAt: updated.settledAt.toISOString(),
      note: updated.note,
      createdByUserId: updated.createdByUserId,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  static async deleteSettlement(
    settlementId: string,
    userId: string,
  ): Promise<void> {
    const settlement = await prisma.splitSettlement.findUniqueOrThrow({
      where: { id: settlementId },
    });

    const member = await requireActiveMemberForUser(settlement.groupId, userId);
    const isAdmin = member.role === "admin";
    const isCreator = settlement.createdByUserId === userId;
    const withinWindow =
      Date.now() - settlement.createdAt.getTime() < EDIT_WINDOW_MS;

    if (!isAdmin && !(isCreator && withinWindow)) {
      throw new Error("Not allowed to delete this settlement");
    }

    await runPrismaBatch([
      prisma.splitSettlement.update({
        where: { id: settlementId },
        data: { deletedAt: new Date(), deletedByUserId: userId },
      }),
      SplitActivityService.createLogOperation(settlement.groupId, {
        actorMemberId: member.id,
        action: "deleted",
        entityType: "settlement",
        entityId: settlementId,
      }),
    ]);
  }
}
