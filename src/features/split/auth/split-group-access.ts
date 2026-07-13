import { prisma } from "@/features/util/prisma";
import type { SplitGroupMember } from "@prisma/client";

const ACTIVE_STATUSES = ["linked", "guest", "pending"] as const;

export class SplitAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SplitAccessError";
  }
}

export async function getActiveMemberForUser(
  groupId: string,
  userId: string,
): Promise<SplitGroupMember | null> {
  return prisma.splitGroupMember.findFirst({
    where: {
      groupId,
      userId,
      status: { in: [...ACTIVE_STATUSES] },
    },
  });
}

export async function requireActiveMemberForUser(
  groupId: string,
  userId: string,
): Promise<SplitGroupMember> {
  const member = await getActiveMemberForUser(groupId, userId);
  if (!member) {
    throw new SplitAccessError("Not a member of this group");
  }
  return member;
}

export async function withSplitGroupAccess<T>(
  groupId: string,
  userId: string,
  handler: (member: SplitGroupMember) => Promise<T> | T,
): Promise<T> {
  const member = await requireActiveMemberForUser(groupId, userId);
  return handler(member);
}

export async function isGroupAdmin(
  groupId: string,
  userId: string,
): Promise<boolean> {
  const member = await getActiveMemberForUser(groupId, userId);
  return member?.role === "admin";
}

export function canEditExpense(
  member: SplitGroupMember,
  expense: { createdByUserId: string | null; paidByMemberId: string },
  userId: string,
): boolean {
  if (member.role === "admin") return true;
  if (expense.createdByUserId === userId) return true;
  if (expense.paidByMemberId === member.id) return true;
  return false;
}

export function canEditSettlement(
  member: SplitGroupMember,
  settlement: {
    fromMemberId: string;
    toMemberId: string;
    createdByUserId: string | null;
  },
  userId: string,
): boolean {
  if (member.role === "admin") return true;
  if (settlement.createdByUserId === userId) return true;
  if (
    member.id === settlement.fromMemberId ||
    member.id === settlement.toMemberId
  ) {
    return true;
  }
  return false;
}
