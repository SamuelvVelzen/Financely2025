import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { HiPencil, HiTrash } from "react-icons/hi2";

type IBudgetDetailActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  size: "xs" | "sm";
};

export function BudgetDetailActionsMenu({
  onEdit,
  onDelete,
  size,
}: IBudgetDetailActionsMenuProps) {
  return (
    <Dropdown size={size}>
      <DropdownItem icon={<HiPencil className="size-4" />} clicked={onEdit}>
        Edit
      </DropdownItem>
      <DropdownItem
        icon={<HiTrash className="size-4" />}
        clicked={onDelete}
        className="text-danger">
        Delete
      </DropdownItem>
    </Dropdown>
  );
}
