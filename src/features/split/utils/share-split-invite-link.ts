import { getSplitGuestInviteUrl } from "@/features/split/utils/split-guest-invite-url";

export type ISplitInviteShareResult = "shared" | "copied" | "cancelled";

export async function copySplitInviteLink(token: string): Promise<void> {
  await navigator.clipboard.writeText(getSplitGuestInviteUrl(token));
}

export async function shareSplitInviteLink(
  token: string,
  groupName: string,
): Promise<ISplitInviteShareResult> {
  const url = getSplitGuestInviteUrl(token);

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: `Join ${groupName} on Financely`,
        text: `Join "${groupName}" to split expenses together.`,
        url,
      });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  await copySplitInviteLink(token);
  return "copied";
}
