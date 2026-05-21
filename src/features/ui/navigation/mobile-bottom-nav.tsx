import { AddOrEditTransactionDialog } from "@/features/transaction/components/add-or-edit-transaction-dialog";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { cn } from "@/features/util/cn";
import { useState } from "react";
import {
  HiArrowsRightLeft,
  HiChartBar,
  HiOutlineCurrencyEuro,
  HiOutlineTag,
  HiPlus,
} from "react-icons/hi2";
import { IconButton } from "../button/icon-button";
import { Container } from "../container/container";
import { MobileNavItem } from "./mobile-nav-item";

export function MobileBottomNav() {
  const workspaceId = useNavWorkspaceId();
  const workspaceParams = { workspaceId: workspaceIdToRouteParam(workspaceId) };
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  const handleCreateTransaction = () => {
    setIsTransactionDialogOpen(true);
  };

  return (
    <>
      <Container
        className={cn(
          "md:hidden mb-0 flex items-stretch",
          "fixed bottom-0 left-0 right-0 z-50",
          "h-20",
          "border-b-0 rounded-b-none",
          "p-0"
        )}
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
        aria-label="Bottom navigation">
        <nav className="relative flex w-full">
          <MobileNavItem
            to="/$workspaceId"
            params={workspaceParams}
            label="Dashboard"
            icon={HiChartBar}
            className="flex-1"
          />
          <MobileNavItem
            to="/$workspaceId/budgets"
            params={workspaceParams}
            label="Budgets"
            icon={HiOutlineCurrencyEuro}
            className="flex-1"
          />
          <div className="flex items-center justify-center max-w-15 flex-1 px-2 relative -top-7 m-0 p-0">
            <IconButton
              clicked={handleCreateTransaction}
              variant="primary"
              aria-label="Add transaction">
              <HiPlus className="size-10" />
            </IconButton>
          </div>
          <MobileNavItem
            to="/$workspaceId/transactions"
            params={workspaceParams}
            label="Transactions"
            icon={HiArrowsRightLeft}
            className="flex-1"
          />
          <MobileNavItem
            to="/$workspaceId/tags"
            params={workspaceParams}
            label="Tags"
            icon={HiOutlineTag}
            className="flex-1"
          />
        </nav>
      </Container>
      <AddOrEditTransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
      />
    </>
  );
}
