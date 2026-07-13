import {
  copySplitInviteLink,
  shareSplitInviteLink,
} from "@/features/split/utils/share-split-invite-link";
import { getSplitGuestInviteUrl } from "@/features/split/utils/split-guest-invite-url";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { useToast } from "@/features/ui/toast";
import { HiClipboardDocument, HiLink, HiShare } from "react-icons/hi2";

type ISplitGroupShareLinkProps = {
  guestAccessToken: string;
  groupName: string;
};

export function SplitGroupShareLink({
  guestAccessToken,
  groupName,
}: ISplitGroupShareLinkProps) {
  const toast = useToast();
  const inviteUrl = getSplitGuestInviteUrl(guestAccessToken);
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const handleCopy = async () => {
    try {
      await copySplitInviteLink(guestAccessToken);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleShare = async () => {
    try {
      const result = await shareSplitInviteLink(guestAccessToken, groupName);
      if (result === "copied") {
        toast.success("Invite link copied");
      } else if (result === "shared") {
        toast.success("Invite link shared");
      }
    } catch {
      toast.error("Could not share link");
    }
  };

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <HiLink className="size-5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base font-semibold text-text">Share a link</h3>
          <p className="text-sm leading-relaxed text-text-muted mt-1.5">
            Send this link in a chat or group message. Anyone with it can join
            as a guest and add expenses.
          </p>
        </div>
      </div>

      <div className="flex items-stretch gap-2 rounded-2xl border border-border bg-background p-1.5">
        <p className="min-w-0 flex-1 self-center truncate px-3 py-1 text-sm text-text-muted">
          {inviteUrl}
        </p>
        <IconButton
          size="sm"
          variant="secondary"
          ariaLabel="Copy invite link"
          clicked={() => void handleCopy()}
          className="shrink-0">
          <HiClipboardDocument className="size-4" />
        </IconButton>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          clicked={() => void handleCopy()}
          className="flex-1">
          <HiClipboardDocument className="size-4" />
          Copy link
        </Button>
        {canNativeShare ? (
          <Button
            variant="primary"
            clicked={() => void handleShare()}
            className="flex-1">
            <HiShare className="size-4" />
            Share link
          </Button>
        ) : null}
      </div>
    </section>
  );
}
