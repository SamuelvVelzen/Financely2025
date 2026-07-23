import { prisma } from "@/features/util/prisma";
import type { SplitGroup, SplitGroupMember } from "@prisma/client";

export const GUEST_SESSION_COOKIE = "split_guest_session";

export type IGuestContext = {
  group: SplitGroup;
  member: SplitGroupMember;
};

export class SplitGuestAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SplitGuestAccessError";
  }
}

export function getGuestSessionIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`${GUEST_SESSION_COOKIE}=([^;]+)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function getGroupByGuestToken(
  token: string,
): Promise<SplitGroup | null> {
  return prisma.splitGroup.findUnique({ where: { guestAccessToken: token } });
}

export async function requireGuestAccess(
  token: string,
  guestSessionId: string | null,
): Promise<IGuestContext> {
  const group = await getGroupByGuestToken(token);
  if (!group) {
    throw new SplitGuestAccessError("Invalid share link");
  }
  if (!guestSessionId) {
    throw new SplitGuestAccessError("Guest session required");
  }

  const member = await prisma.splitGroupMember.findFirst({
    where: {
      groupId: group.id,
      guestSessionId,
      status: "guest",
    },
  });

  if (!member) {
    throw new SplitGuestAccessError("Guest session not found");
  }

  return { group, member };
}

export function assertGuestCan(
  group: SplitGroup,
  action: "view" | "add" | "settle" | "editOwn",
): void {
  const flags: Record<typeof action, keyof SplitGroup> = {
    view: "guestCanView",
    add: "guestCanAdd",
    settle: "guestCanSettle",
    editOwn: "guestCanEditOwn",
  };
  if (!group[flags[action]]) {
    throw new SplitGuestAccessError(`Guests cannot ${action}`);
  }
}
