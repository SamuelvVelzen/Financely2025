import type { INotification } from "@/features/shared/validation/schemas";
import { formatDateHeader } from "@/features/util/date/date-helpers";
import { parseISO } from "date-fns";

export type INotificationDateGroup = {
  date: string;
  dateHeader: string;
  notifications: INotification[];
};

/**
 * Group notifications by created calendar date (most recent first).
 */
export function groupNotificationsByDate(
  notifications: INotification[],
): INotificationDateGroup[] {
  const dateMap = new Map<string, INotification[]>();

  for (const notification of notifications) {
    const dateKey = parseISO(notification.createdAt).toISOString().split("T")[0]!;
    const bucket = dateMap.get(dateKey);
    if (bucket) {
      bucket.push(notification);
    } else {
      dateMap.set(dateKey, [notification]);
    }
  }

  return Array.from(dateMap.entries())
    .map(([dateKey, groupNotifications]) => {
      const dateObj = parseISO(`${dateKey}T00:00:00.000Z`);
      return {
        date: dateKey,
        dateHeader: formatDateHeader(dateObj),
        notifications: groupNotifications.toSorted(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      };
    })
    .toSorted((a, b) => b.date.localeCompare(a.date));
}
