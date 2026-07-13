import { prisma } from "@/features/util/prisma";
import { simplifyDebts } from "../utils/simplify-debts";

export type ISplitBalancesResult = {
  currency: string;
  memberBalances: Array<{
    memberId: string;
    displayName: string;
    netAmount: string;
  }>;
  simplifiedDebts: ReturnType<typeof simplifyDebts>;
};

export class SplitBalanceService {
  static async getBalances(
    groupId: string,
    viewerUserId?: string,
  ): Promise<ISplitBalancesResult & { viewerNetAmount?: string }> {
    const group = await prisma.splitGroup.findUniqueOrThrow({
      where: { id: groupId },
      select: { defaultCurrency: true },
    });

    const members = await prisma.splitGroupMember.findMany({
      where: {
        groupId,
        status: { in: ["linked", "guest", "pending"] },
      },
      select: { id: true, displayName: true, userId: true },
    });

    const netByMember = new Map<string, number>();
    for (const m of members) {
      netByMember.set(m.id, 0);
    }

    const expenses = await prisma.splitExpense.findMany({
      where: {
        groupId,
        conversionStatus: "converted",
      },
      include: {
        shares: {
          where: { status: "active" },
        },
      },
    });

    for (const expense of expenses) {
      const groupAmount = expense.groupAmount
        ? parseFloat(expense.groupAmount.toString())
        : 0;
      if (groupAmount === 0) continue;

      const payerShare = expense.shares.find(
        (s) => s.memberId === expense.paidByMemberId,
      );
      const payerGroupShare = payerShare?.shareGroupAmount
        ? parseFloat(payerShare.shareGroupAmount.toString())
        : 0;

      const payerNet =
        (netByMember.get(expense.paidByMemberId) ?? 0) +
        (groupAmount - payerGroupShare);
      netByMember.set(expense.paidByMemberId, payerNet);

      for (const share of expense.shares) {
        const shareAmount = share.shareGroupAmount
          ? parseFloat(share.shareGroupAmount.toString())
          : 0;
        const current = netByMember.get(share.memberId) ?? 0;
        netByMember.set(share.memberId, current - shareAmount);
      }
    }

    const settlements = await prisma.splitSettlement.findMany({
      where: { groupId, deletedAt: null },
    });

    for (const settlement of settlements) {
      const amount = parseFloat(settlement.amount.toString());
      const fromNet = (netByMember.get(settlement.fromMemberId) ?? 0) + amount;
      const toNet = (netByMember.get(settlement.toMemberId) ?? 0) - amount;
      netByMember.set(settlement.fromMemberId, fromNet);
      netByMember.set(settlement.toMemberId, toNet);
    }

    const memberBalances = members.map((m) => ({
      memberId: m.id,
      displayName: m.displayName,
      netAmount: (netByMember.get(m.id) ?? 0).toFixed(2),
    }));

    const simplifiedDebts = simplifyDebts(memberBalances, group.defaultCurrency);

    let viewerNetAmount: string | undefined;
    if (viewerUserId) {
      const viewerMember = members.find((m) => m.userId === viewerUserId);
      if (viewerMember) {
        viewerNetAmount = (netByMember.get(viewerMember.id) ?? 0).toFixed(2);
      }
    }

    return {
      currency: group.defaultCurrency,
      memberBalances,
      simplifiedDebts,
      viewerNetAmount,
    };
  }

  static async getSummaryForUser(userId: string): Promise<{
    groups: Array<{
      groupId: string;
      groupName: string;
      currency: string;
      netAmount: string;
    }>;
  }> {
    const memberships = await prisma.splitGroupMember.findMany({
      where: {
        userId,
        status: "linked",
      },
      include: { group: { select: { id: true, name: true, defaultCurrency: true } } },
    });

    const groups = await Promise.all(
      memberships.map(async (m) => {
        const balances = await this.getBalances(m.groupId, userId);
        return {
          groupId: m.group.id,
          groupName: m.group.name,
          currency: m.group.defaultCurrency,
          netAmount: balances.viewerNetAmount ?? "0.00",
        };
      }),
    );

    return { groups };
  }
}
