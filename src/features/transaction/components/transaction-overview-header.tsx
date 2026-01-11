import { useResponsive } from "@/features/shared/hooks/useResponsive";
import type { IFilterProps } from "@/features/transaction/hooks/use-transaction-filter-props";
import { useTransactionHeader } from "@/features/transaction/hooks/use-transaction-header";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownDivider } from "@/features/ui/dropdown/dropdown-divider";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { cn } from "@/features/util/cn";
import {
  HiArrowDownTray,
  HiArrowsRightLeft,
  HiArrowUpTray,
  HiFunnel,
  HiPlus,
} from "react-icons/hi2";
import { TransactionFilters } from "./transaction-filters";

/**
 * Action handlers for transaction header
 */
export interface IActionHandlers {
  onCreateTransaction: () => void;
  onCsvImportClick: () => void;
  onCsvExportClick: () => void;
}

export interface ITransactionOverviewHeaderProps {
  filterProps: IFilterProps;
  actions: IActionHandlers;
  isSticky: boolean;
  filterCount: number;
  onFiltersClick: () => void;
}

export function TransactionOverviewHeader({
  filterProps,
  actions,
  isSticky,
  filterCount,
  onFiltersClick,
}: ITransactionOverviewHeaderProps) {
  // Calculate month display inside the component
  const { monthDisplay } = useTransactionHeader(filterProps.filterState);
  const { isMobile } = useResponsive();

  return (
    <Container className={cn("sticky z-10 top-0 transition-all")}>
      {/* Title section - animates between sizes */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 transition-all",
          !isSticky && "mb-3"
        )}>
        <div className="flex gap-2 items-center">
          <HiArrowsRightLeft
            className={cn(
              "shrink-0 transition-all",
              isSticky ? "size-5" : "size-6"
            )}
          />
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "transition-all",
                isSticky ? "text-base font-semibold" : "text-xl font-bold"
              )}>
              Transactions
            </span>
            {!isSticky && (
              <span className="text-sm text-text-muted font-normal self-end">
                ({monthDisplay})
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {isSticky ? (
            // Sticky: Show Add button (desktop only) + Filters button
            <>
              {!isMobile && (
                <Button
                  clicked={actions.onCreateTransaction}
                  variant="primary"
                  size="sm">
                  <HiPlus className="size-5" /> Add
                </Button>
              )}
              <Button
                clicked={onFiltersClick}
                variant={filterProps.hasActiveFilters ? "primary" : "default"}
                size="sm"
                buttonContent={
                  <div className="flex items-center gap-2">
                    <HiFunnel className="size-4" />
                    <span>
                      Filters
                      {filterProps.hasActiveFilters ? ` (${filterCount})` : ""}
                    </span>
                  </div>
                }
              />
            </>
          ) : (
            // Expanded: Show Add button and Dropdown
            <>
              <Button
                clicked={actions.onCreateTransaction}
                variant="primary"
                size="sm">
                <HiPlus className="size-6" /> Add
              </Button>

              <Dropdown>
                <DropdownItem
                  icon={<HiArrowDownTray />}
                  clicked={actions.onCsvImportClick}>
                  Import from CSV
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                  icon={<HiArrowUpTray />}
                  clicked={actions.onCsvExportClick}>
                  Export to CSV
                </DropdownItem>
              </Dropdown>
            </>
          )}
        </div>
      </div>

      {/* Filters section - animates height and opacity when sticky */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity]  ease-out",
          isSticky ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}>
        <div className="overflow-hidden">
          <TransactionFilters {...filterProps} />
        </div>
      </div>
    </Container>
  );
}
