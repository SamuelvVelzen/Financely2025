import { prisma } from "@/features/util/prisma";
import { normalizeEmail } from "../utils/normalize-email";
import { SplitTransactionSyncService } from "./split-transaction-sync.service";

export class SplitMemberLinkService {
  static async linkByNormalizedEmail(
    userId: string,
    email: string,
  ): Promise<number> {
    const normalized = normalizeEmail(email);

    const pendingMembers = await prisma.splitGroupMember.findMany({
      where: {
        normalizedEmail: normalized,
        status: "pending",
        userId: null,
      },
    });

    if (pendingMembers.length === 0) {
      return 0;
    }

    await prisma.splitGroupMember.updateMany({
      where: {
        id: { in: pendingMembers.map((m) => m.id) },
      },
      data: {
        userId,
        status: "linked",
      },
    });

    await SplitTransactionSyncService.backfillForUser(userId);

    return pendingMembers.length;
  }
}
