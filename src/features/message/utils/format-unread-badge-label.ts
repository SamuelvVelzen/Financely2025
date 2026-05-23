const UNREAD_BADGE_MAX = 9;

/** Nav badge label for unread messages; caps display at "9+". */
export function formatUnreadBadgeLabel(count: number): string {
  if (count > UNREAD_BADGE_MAX) {
    return `${UNREAD_BADGE_MAX}+`;
  }
  return String(count);
}
