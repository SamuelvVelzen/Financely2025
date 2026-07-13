import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import {
  HiClipboardDocument,
  HiPencil,
  HiShare,
  HiTrash,
  HiUserPlus,
} from "react-icons/hi2";

export function SplitGroupDetailActionsMenu({
  onEdit,
  onDelete,
  onCopyLink,
  onShareLink,
  onManageMembers,
  size = "sm",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyLink?: () => void;
  onShareLink?: () => void;
  onManageMembers?: () => void;
  size?: "xs" | "sm";
}) {
  return (
    <Dropdown size={size}>
      {onManageMembers ? (
        <DropdownItem
          icon={<HiUserPlus className="size-4" />}
          clicked={onManageMembers}>
          Manage people
        </DropdownItem>
      ) : null}
      {onCopyLink ? (
        <DropdownItem
          icon={<HiClipboardDocument className="size-4" />}
          clicked={onCopyLink}>
          Copy invite link
        </DropdownItem>
      ) : null}
      {onShareLink ? (
        <DropdownItem icon={<HiShare className="size-4" />} clicked={onShareLink}>
          Share invite link
        </DropdownItem>
      ) : null}
      {onEdit ? (
        <DropdownItem icon={<HiPencil className="size-4" />} clicked={onEdit}>
          Edit group
        </DropdownItem>
      ) : null}
      {onDelete ? (
        <DropdownItem
          icon={<HiTrash className="size-4" />}
          clicked={onDelete}
          className="text-danger hover:bg-danger/10">
          Delete group
        </DropdownItem>
      ) : null}
    </Dropdown>
  );
}
