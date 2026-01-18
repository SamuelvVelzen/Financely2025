import { ROUTES } from "@/config/routes";
import { AddOrCreateTransactionDialog } from "@/features/transaction/components/add-or-create-transaction-dialog";
import { cn } from "@/features/util/cn";
import { useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  const handleCreateTransaction = () => {
    setIsTransactionDialogOpen(true);
  };

  return (
    <>
      <Container
        as="nav"
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
        <MobileNavItem
          to={ROUTES.ROOT}
          label="Dashboard"
          icon={HiChartBar}
          className="flex-1"
        />
        <MobileNavItem
          to={ROUTES.BUDGETS}
          label="Budgets"
          icon={HiOutlineCurrencyEuro}
          className="flex-1"
        />
        <div className="flex items-center justify-center max-w-15 flex-1 px-2 relative">
          <IconButton
            clicked={handleCreateTransaction}
            variant="primary"
            className={cn("size-14 absolute -top-7 m-0 p-0")}
            aria-label="Add transaction">
            <HiPlus className="size-7" />
          </IconButton>
        </div>
        <MobileNavItem
          to={ROUTES.TRANSACTIONS}
          label="Transactions"
          icon={HiArrowsRightLeft}
          className="flex-1"
        />
        <MobileNavItem
          to={ROUTES.TAGS}
          label="Tags"
          icon={HiOutlineTag}
          className="flex-1"
        />
      </Container>
      <AddOrCreateTransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
      />
    </>
  );
}
