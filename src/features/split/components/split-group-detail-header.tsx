import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { SplitGroupDetailActionsMenu } from "@/features/split/components/split-group-detail-actions-menu";
import { HiArrowLeft, HiUsers } from "react-icons/hi2";

export function SplitGroupDetailHeader({
  groupName,
  currency,
  onBack,
  onEdit,
  canEdit,
  onDelete,
  canDelete,
}: {
  groupName: string;
  currency: string;
  onBack: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
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
        {(canEdit && onEdit) || (canDelete && onDelete) ? (
          <SplitGroupDetailActionsMenu
            onEdit={canEdit ? onEdit : undefined}
            onDelete={canDelete ? onDelete : undefined}
          />
        ) : null}
      </div>
    </Container>
  );
}
