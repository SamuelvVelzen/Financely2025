import { prisma } from "@/features/util/prisma";
import { requireActiveMemberForUser } from "../auth/split-group-access";
import { SplitActivityService } from "./split-activity.service";
import type { ICreateSplitSettlementInput } from "../validation/schemas";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

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
      where: { id: actorMemberId, groupId, status: { in: ["linked", "guest"] } },
    });

    if (
      actor.id !== input.fromMemberId &&
      actor.id !== input.toMemberId &&
      actor.role !== "admin"
    ) {
      throw new Error("You must be involved in the settlement");
    }

    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.splitSettlement.create({
        data: {
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
      });

      await SplitActivityService.log(
        groupId,
        {
          actorMemberId: actor.id,
          action: "created",
          entityType: "settlement",
          entityId: created.id,
          after: { amount: input.amount },
        },
        tx,
      );

      return created;
    });

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

    await prisma.$transaction(async (tx) => {
      await tx.splitSettlement.update({
        where: { id: settlementId },
        data: { deletedAt: new Date(), deletedByUserId: userId },
      });
      await SplitActivityService.log(
        settlement.groupId,
        {
          actorMemberId: member.id,
          action: "deleted",
          entityType: "settlement",
          entityId: settlementId,
        },
        tx,
      );
    });
  }
}
