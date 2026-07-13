import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { SplitGroupDetailActionsMenu } from "@/features/split/components/split-group-detail-actions-menu";
import {
  copySplitInviteLink,
  shareSplitInviteLink,
} from "@/features/split/utils/share-split-invite-link";
import { useToast } from "@/features/ui/toast";
import { HiArrowLeft, HiUsers } from "react-icons/hi2";

export function SplitGroupDetailHeader({
  groupName,
  currency,
  guestAccessToken,
  onBack,
  onEdit,
  canEdit,
  onDelete,
  canDelete,
}: {
  groupName: string;
  currency: string;
  guestAccessToken?: string;
  onBack: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
  const toast = useToast();
  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  const handleCopyLink = async () => {
    if (!guestAccessToken) {
      return;
    }

    try {
      await copySplitInviteLink(guestAccessToken);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleShareLink = async () => {
    if (!guestAccessToken) {
      return;
    }

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

  const showEdit = Boolean(canEdit && onEdit);
  const showDelete = Boolean(canDelete && onDelete);
  const showCopyLink = Boolean(guestAccessToken);
  const showShareLink = Boolean(guestAccessToken && canNativeShare);
  const showActionsMenu =
    showEdit || showDelete || showCopyLink || showShareLink;

  return (
    <Container className="sticky z-10 top-0 mb-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton clicked={onBack} ariaLabel="Back to splits">
            <HiArrowLeft className="size-4 shrink-0" />
          </IconButton>
          <HiUsers className="size-6 shrink-0" />
          <div className="min-w-0">
            <span className="block truncate text-xl font-bold">{groupName}</span>
            <p className="text-sm text-text-muted">Balances in {currency}</p>
          </div>
        </div>
        {showActionsMenu ? (
          <SplitGroupDetailActionsMenu
            onCopyLink={showCopyLink ? () => void handleCopyLink() : undefined}
            onShareLink={
              showShareLink ? () => void handleShareLink() : undefined
            }
            onEdit={showEdit ? onEdit : undefined}
            onDelete={showDelete ? onDelete : undefined}
          />
        ) : null}
      </div>
    </Container>
  );
}
