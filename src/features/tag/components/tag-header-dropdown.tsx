import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { DragHandleIcon } from "@/features/ui/list/drag-handle-icon";
import {
  HiArrowDownTray,
  HiOutlineRectangleStack,
} from "react-icons/hi2";
import type { IActionHandlers } from "./tag-overview-header";

type ITagHeaderDropdownProps = {
  actions: IActionHandlers;
  isReorderMode: boolean;
  size?: "xs" | "sm" | "md" | "lg";
};

export function TagHeaderDropdown({
  actions,
  isReorderMode,
  size = "sm",
}: ITagHeaderDropdownProps) {
  return (
    <Dropdown size={size}>
      <DropdownItem
        icon={<DragHandleIcon className="size-4" />}
        text="Reorder tags"
        clicked={actions.onToggleReorder}
        selected={isReorderMode}
      />
      <DropdownItem
        icon={<HiArrowDownTray className="size-4" />}
        clicked={actions.onCsvImportClick}>
        Import from CSV
      </DropdownItem>
      <DropdownItem
        icon={<HiOutlineRectangleStack className="size-4" />}
        clicked={actions.onSmartTaggingClick}>
        Smart tagging & presets
      </DropdownItem>
    </Dropdown>
  );
}
