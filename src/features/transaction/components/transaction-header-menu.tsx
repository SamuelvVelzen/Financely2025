import { Dropdown } from "@/features/ui/dropdown/dropdown";
import type { IActionHandlers } from "./transaction-overview-header";
import { TransactionActionsMenuItems } from "./transaction-actions-menu-items";

type ITransactionHeaderMenuProps = {
  actions: IActionHandlers;
  includeAddAction?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
};

export function TransactionHeaderMenu({
  actions,
  includeAddAction = false,
  size = "sm",
}: ITransactionHeaderMenuProps) {
  return (
    <Dropdown size={size}>
      <TransactionActionsMenuItems
        actions={actions}
        includeAddAction={includeAddAction}
      />
    </Dropdown>
  );
}
