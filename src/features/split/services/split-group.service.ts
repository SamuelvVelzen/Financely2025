import { prisma } from "@/features/util/prisma";
import { randomBytes } from "node:crypto";
import { SplitActivityService } from "./split-activity.service";
import { normalizeEmail } from "../utils/normalize-email";
import type {
  ICreateSplitGroupInput,
  IUpdateSplitGroupInput,
  IAddSplitMemberInput,
} from "../validation/schemas";

function generateGuestToken(): string {
  return randomBytes(24).toString("base64url");
}

export class SplitGroupService {
  static async listGroups(userId: string) {
    const memberships = await prisma.splitGroupMember.findMany({
      where: {
        userId,
        status: { in: ["linked", "pending"] },
      },
      include: {
        group: {
          include: {
            members: {
              where: { status: { in: ["linked", "guest", "pending"] } },
            },
            _count: { select: { expenses: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      defaultCurrency: m.group.defaultCurrency,
      memberCount: m.group.members.length,
      expenseCount: m.group._count.expenses,
      role: m.role,
      isCreator: m.group.createdByUserId === userId,
      joinedAt: m.joinedAt.toISOString(),
    }));
  }

  static async listActiveMembers(groupId: string) {
    const members = await prisma.splitGroupMember.findMany({
      where: {
        groupId,
        status: { in: ["linked", "guest", "pending"] },
      },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        displayName: true,
        status: true,
        role: true,
      },
    });

    return members;
  }

  static async getGroup(groupId: string, userId: string) {
    const member = await prisma.splitGroupMember.findFirst({
      where: {
        groupId,
        userId,
        status: { in: ["linked", "pending"] },
      },
    });
    if (!member) {
      throw new Error("Not a member of this group");
    }

    const group = await prisma.splitGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        members: {
          where: { status: { in: ["linked", "guest", "pending"] } },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return {
      id: group.id,
      name: group.name,
      defaultCurrency: group.defaultCurrency,
      guestCanView: group.guestCanView,
      guestCanAdd: group.guestCanAdd,
      guestCanSettle: group.guestCanSettle,
      guestCanEditOwn: group.guestCanEditOwn,
      guestAccessToken:
        member.role === "admin" ? group.guestAccessToken : undefined,
      createdAt: group.createdAt.toISOString(),
      members: group.members.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        email: m.email,
        status: m.status,
        role: m.role,
        userId: m.userId,
        joinedAt: m.joinedAt.toISOString(),
      })),
      currentMemberId: member.id,
      currentMemberRole: member.role,
      isCreator: group.createdByUserId === userId,
    };
  }

  static async createGroup(userId: string, input: ICreateSplitGroupInput) {
    const userInfo = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { userInfo: true },
    });

    const displayName =
      [userInfo.userInfo.firstName, userInfo.userInfo.lastName]
        .filter(Boolean)
        .join(" ") || userInfo.userInfo.email;

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.splitGroup.create({
        data: {
          name: input.name.trim(),
          defaultCurrency: input.defaultCurrency,
          createdByUserId: userId,
          guestAccessToken: generateGuestToken(),
          guestCanSettle: true,
        },
      });

      const member = await tx.splitGroupMember.create({
        data: {
          groupId: created.id,
          userId,
          displayName,
          email: userInfo.userInfo.email,
          normalizedEmail: normalizeEmail(userInfo.userInfo.email),
          status: "linked",
          role: "admin",
        },
      });

      await SplitActivityService.log(
        created.id,
        {
          actorMemberId: member.id,
          action: "created",
          entityType: "group",
          entityId: created.id,
          after: { name: created.name },
        },
        tx,
      );

      return created;
    });

    return this.getGroup(group.id, userId);
  }

  static async updateGroup(
    groupId: string,
    userId: string,
    input: IUpdateSplitGroupInput,
  ) {
    const member = await prisma.splitGroupMember.findFirst({
      where: { groupId, userId, status: "linked", role: "admin" },
    });
    if (!member) {
      throw new Error("Only admins can update the group");
    }

    if (input.defaultCurrency) {
      const expenseCount = await prisma.splitExpense.count({
        where: { groupId },
      });
      if (expenseCount > 0) {
        throw new Error("Cannot change currency after expenses exist");
      }
    }

    await prisma.splitGroup.update({
      where: { id: groupId },
      data: {
        name: input.name?.trim(),
        defaultCurrency: input.defaultCurrency,
        guestCanView: input.guestCanView,
        guestCanAdd: input.guestCanAdd,
        guestCanSettle: input.guestCanSettle,
        guestCanEditOwn: input.guestCanEditOwn,
      },
    });

    return this.getGroup(groupId, userId);
  }

  static async deleteGroup(groupId: string, userId: string): Promise<void> {
    const group = await prisma.splitGroup.findUnique({
      where: { id: groupId },
    });
    if (!group || group.createdByUserId !== userId) {
      throw new Error("Only the creator can delete the group");
    }
    await prisma.splitGroup.delete({ where: { id: groupId } });
  }

  static async addMember(
    groupId: string,
    userId: string,
    input: IAddSplitMemberInput,
  ) {
    await prisma.splitGroupMember.findFirstOrThrow({
      where: { groupId, userId, status: "linked" },
    });

    const normalized = normalizeEmail(input.email);
    const existing = await prisma.splitGroupMember.findFirst({
      where: {
        groupId,
        normalizedEmail: normalized,
        status: { in: ["linked", "guest", "pending"] },
      },
    });
    if (existing) {
      throw new Error("Member already in group");
    }

    const linkedUser = await prisma.user.findFirst({
      where: {
        userInfo: { email: normalized },
      },
      include: { userInfo: true },
    });

    const member = await prisma.splitGroupMember.create({
      data: {
        groupId,
        userId: linkedUser?.id ?? null,
        email: input.email.trim(),
        normalizedEmail: normalized,
        displayName: input.displayName?.trim() || input.email.split("@")[0]!,
        status: linkedUser ? "linked" : "pending",
      },
    });

    if (linkedUser) {
      const { SplitTransactionSyncService } = await import(
        "./split-transaction-sync.service"
      );
      await SplitTransactionSyncService.backfillForUser(linkedUser.id);
    }

    return {
      id: member.id,
      displayName: member.displayName,
      email: member.email,
      status: member.status,
      role: member.role,
    };
  }

  static async removeMember(
    groupId: string,
    userId: string,
    memberId: string,
  ): Promise<void> {
    const actor = await prisma.splitGroupMember.findFirst({
      where: { groupId, userId, status: "linked" },
    });
    if (!actor || (actor.role !== "admin" && actor.id !== memberId)) {
      throw new Error("Not allowed to remove this member");
    }

    await prisma.splitGroupMember.update({
      where: { id: memberId },
      data: { status: "removed", removedAt: new Date() },
    });
  }

  static async rotateGuestLink(groupId: string, userId: string): Promise<string> {
    const member = await prisma.splitGroupMember.findFirst({
      where: { groupId, userId, status: "linked", role: "admin" },
    });
    if (!member) {
      throw new Error("Only admins can rotate the guest link");
    }

    const token = generateGuestToken();
    await prisma.splitGroup.update({
      where: { id: groupId },
      data: { guestAccessToken: token },
    });

    await SplitActivityService.log(groupId, {
      actorMemberId: member.id,
      action: "rotated_guest_link",
      entityType: "group",
      entityId: groupId,
    });

    return token;
  }

  static async joinAsGuest(
    token: string,
    displayName: string,
    guestSessionId: string,
  ) {
    const group = await prisma.splitGroup.findUnique({
      where: { guestAccessToken: token },
    });
    if (!group) {
      throw new Error("Invalid share link");
    }

    const existing = await prisma.splitGroupMember.findFirst({
      where: { groupId: group.id, guestSessionId, status: "guest" },
    });
    if (existing) {
      return { memberId: existing.id, groupId: group.id };
    }

    const member = await prisma.splitGroupMember.create({
      data: {
        groupId: group.id,
        displayName: displayName.trim(),
        status: "guest",
        guestSessionId,
      },
    });

    return { memberId: member.id, groupId: group.id };
  }
}
