import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { HiClipboardDocument, HiPencil, HiShare, HiTrash } from "react-icons/hi2";

export function SplitGroupDetailActionsMenu({
  onEdit,
  onDelete,
  onCopyLink,
  onShareLink,
  size = "sm",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyLink?: () => void;
  onShareLink?: () => void;
  size?: "xs" | "sm";
}) {
  return (
    <Dropdown size={size}>
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
