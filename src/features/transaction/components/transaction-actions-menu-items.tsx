import { DropdownDivider } from "@/features/ui/dropdown/dropdown-divider";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import {
  HiArrowDownTray,
  HiArrowPath,
  HiArrowUpTray,
  HiArrowsRightLeft,
  HiPlus,
} from "react-icons/hi2";
import type { IActionHandlers } from "./transaction-overview-header";

type ITransactionActionsMenuItemsProps = {
  actions: IActionHandlers;
  includeAddAction?: boolean;
};

export function TransactionActionsMenuItems({
  actions,
  includeAddAction = false,
}: ITransactionActionsMenuItemsProps) {
  return (
    <>
      {includeAddAction && (
        <>
          <DropdownItem
            icon={<HiPlus className="size-4" />}
            clicked={actions.onCreateTransaction}
          >
            Add transaction
          </DropdownItem>
          <DropdownItem
            icon={<HiArrowsRightLeft className="size-4" />}
            clicked={actions.onCreateLinkedTransfer}
          >
            Record transfer
          </DropdownItem>
          <DropdownDivider />
        </>
      )}
      <DropdownItem
        icon={<HiArrowPath />}
        clicked={actions.onDetectSubscriptions}
      >
        Detect Subscriptions
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem
        icon={<HiArrowDownTray />}
        clicked={actions.onCsvImportClick}
      >
        Import from CSV
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem icon={<HiArrowUpTray />} clicked={actions.onCsvExportClick}>
        Export to CSV
      </DropdownItem>
    </>
  );
}
