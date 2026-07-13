import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { HiPencil, HiTrash } from "react-icons/hi2";

export function SplitGroupDetailActionsMenu({
  onEdit,
  onDelete,
  size = "sm",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  size?: "xs" | "sm";
}) {
  return (
    <Dropdown size={size}>
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
