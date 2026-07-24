import { LocaleHelpers } from "@/features/util/locale.helpers";
import { parseISO } from "date-fns";

/**
 * Compact relative timestamp for notification rows.
 */
export function formatNotificationRelativeTime(date: string): string {
  const dateObj = parseISO(date);
  const now = Date.now();
  const diffMs = now - dateObj.getTime();
  const locale = LocaleHelpers.getLocale();

  if (diffMs < 0) {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(dateObj);
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year:
      dateObj.getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  }).format(dateObj);
}
