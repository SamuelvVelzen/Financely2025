import { useState } from "react";
import { SplitSectionCard } from "@/features/split/components/split-section-card";
import { useRotateGuestLink } from "@/features/split/hooks/use-split-groups";
import {
  copySplitInviteLink,
  shareSplitInviteLink,
} from "@/features/split/utils/share-split-invite-link";
import { getSplitGuestInviteUrl } from "@/features/split/utils/split-guest-invite-url";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { useToast } from "@/features/ui/toast";
import { HiArrowPath, HiClipboardDocument, HiLink, HiShare } from "react-icons/hi2";

type ISplitGroupShareLinkProps = {
  groupId: string;
  guestAccessToken: string;
  groupName: string;
};

export function SplitGroupShareLink({
  groupId,
  guestAccessToken,
  groupName,
}: ISplitGroupShareLinkProps) {
  const toast = useToast();
  const rotateGuestLink = useRotateGuestLink(groupId);
  const [resetOpen, setResetOpen] = useState(false);
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

  const handleResetConfirm = () => {
    rotateGuestLink.mutate(undefined as void, {
      onSuccess: () => {
        toast.success("Invite link reset. Share the new link.");
        setResetOpen(false);
      },
      onError: () => {
        toast.error("Could not reset invite link");
      },
    });
  };

  return (
    <>
      <SplitSectionCard
        variant="primary"
        icon={<HiLink className="size-5" />}
        title="Share a link"
        description="Send this link in a chat or group message. Anyone with it can join as a guest and add expenses. Reset it if the link was shared too widely.">
        <div className="flex items-stretch gap-2 rounded-2xl border border-border bg-background p-1.5">
          <p className="min-w-0 flex-1 self-center truncate px-3 py-1 text-sm text-text-muted">
            {inviteUrl}
          </p>
          <IconButton
            size="sm"
            variant="default"
            ariaLabel="Copy invite link"
            clicked={() => void handleCopy()}
            className="shrink-0">
            <HiClipboardDocument className="size-4" />
          </IconButton>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="default"
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

        <Button
          variant="default"
          size="sm"
          clicked={() => setResetOpen(true)}
          className="self-start">
          <HiArrowPath className="size-4" />
          Reset invite link
        </Button>
      </SplitSectionCard>

      <DeleteDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset invite link?"
        content="The current link will stop working for anyone who still has it — including guests who already joined. Share the new link so they can open the group again."
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setResetOpen(false),
          },
          {
            buttonContent: "Reset link",
            variant: "danger",
            clicked: handleResetConfirm,
            loading: {
              isLoading: rotateGuestLink.isPending,
              text: "Resetting link",
            },
          },
        ]}
      />
    </>
  );
}
