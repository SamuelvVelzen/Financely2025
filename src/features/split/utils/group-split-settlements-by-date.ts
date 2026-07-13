import { formatDateHeader } from "@/features/util/date/date-helpers";
import { parseISO } from "date-fns";

export type ISplitSettlement = {
  id: string;
  fromMemberId: string;
  fromDisplayName: string;
  toMemberId: string;
  toDisplayName: string;
  amount: string;
  settledAt: string;
  note: string | null;
};

export type ISplitSettlementDateGroup = {
  date: string;
  dateHeader: string;
  settlements: ISplitSettlement[];
};

export function groupSplitSettlementsByDate(
  settlements: ISplitSettlement[],
): ISplitSettlementDateGroup[] {
  const dateMap = new Map<string, ISplitSettlement[]>();

  for (const settlement of settlements) {
    const dateKey = parseISO(settlement.settledAt).toISOString().split("T")[0]!;
    const bucket = dateMap.get(dateKey);
    if (bucket) {
      bucket.push(settlement);
    } else {
      dateMap.set(dateKey, [settlement]);
    }
  }

  return Array.from(dateMap.entries())
    .map(([dateKey, groupSettlements]) => {
      const dateObj = parseISO(`${dateKey}T00:00:00.000Z`);
      return {
        date: dateKey,
        dateHeader: formatDateHeader(dateObj),
        settlements: groupSettlements.toSorted(
          (a, b) =>
            new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime(),
        ),
      };
    })
    .toSorted((a, b) => b.date.localeCompare(a.date));
}
