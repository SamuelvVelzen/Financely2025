import type { ISplitSettlement } from "@/features/split/utils/group-split-settlements-by-date";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function canEditSplitSettlement(
  settlement: Pick<
    ISplitSettlement,
    "createdByUserId" | "fromMemberId" | "toMemberId"
  >,
  viewer: { userId: string; memberId: string; role: string },
): boolean {
  if (viewer.role === "admin") {
    return true;
  }
  if (
    settlement.createdByUserId != null &&
    settlement.createdByUserId === viewer.userId
  ) {
    return true;
  }
  if (
    settlement.fromMemberId === viewer.memberId ||
    settlement.toMemberId === viewer.memberId
  ) {
    return true;
  }
  return false;
}

export function canDeleteSplitSettlement(
  settlement: Pick<ISplitSettlement, "createdByUserId" | "createdAt">,
  viewer: { userId: string; role: string },
): boolean {
  if (viewer.role === "admin") {
    return true;
  }
  if (
    settlement.createdByUserId == null ||
    settlement.createdByUserId !== viewer.userId
  ) {
    return false;
  }
  return Date.now() - new Date(settlement.createdAt).getTime() < EDIT_WINDOW_MS;
}
