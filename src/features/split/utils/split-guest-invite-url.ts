export function getSplitGuestInviteUrl(token: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/splits/join/${token}`;
}
