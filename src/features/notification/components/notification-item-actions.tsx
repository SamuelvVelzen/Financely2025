import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { HiTrash } from "react-icons/hi2";

type INotificationItemActionsProps = {
  onDelete: () => void;
};

export function NotificationItemActions({
  onDelete,
}: INotificationItemActionsProps) {
  return (
    <div
      className="ml-1 flex items-center"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}>
      <Dropdown size="sm">
        <DropdownItem
          icon={<HiTrash className="size-4" />}
          text="Delete"
          clicked={onDelete}
          className="text-danger hover:bg-danger/10"
        />
      </Dropdown>
    </div>
  );
}
