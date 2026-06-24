import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { ActiveFiltersRow } from "@/features/transaction/components/active-filters-row";
import { useTransactionFilterBadges } from "@/features/transaction/hooks/use-transaction-filter-badges";
import type { IFilterProps } from "@/features/transaction/hooks/use-transaction-filter-props";
import { useTransactionHeader } from "@/features/transaction/hooks/use-transaction-header";
import type { ITransactionLayoutMode } from "@/features/transaction/hooks/use-transaction-view-mode";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownDivider } from "@/features/ui/dropdown/dropdown-divider";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { cn } from "@/features/util/cn";
import {
  HiArrowDownTray,
  HiArrowPath,
  HiArrowsRightLeft,
  HiArrowUpTray,
  HiFunnel,
  HiPlus,
} from "react-icons/hi2";
import { TransactionFilters } from "./transaction-filters";
import { TransactionViewControls } from "./transaction-view-controls";

/**
 * Action handlers for transaction header
 */
export interface IActionHandlers {
  onCreateTransaction: () => void;
  onCsvImportClick: () => void;
  onCsvExportClick: () => void;
  onDetectSubscriptions: () => void;
}

export interface ITransactionViewModeProps {
  layout: ITransactionLayoutMode;
  showDescriptions: boolean;
  onLayoutChange: (layout: ITransactionLayoutMode) => void;
  onShowDescriptionsChange: (show: boolean) => void;
}

export interface ITransactionOverviewHeaderProps {
  filterProps: IFilterProps;
  actions: IActionHandlers;
  isSticky: boolean;
  filterCount: number;
  onFiltersClick: () => void;
  viewMode: ITransactionViewModeProps;
}

function TransactionActionsMenuItems({ actions }: { actions: IActionHandlers }) {
  return (
    <>
      <DropdownItem
        icon={<HiArrowPath />}
        clicked={actions.onDetectSubscriptions}>
        Detect Subscriptions
      </DropdownItem>
      <DropdownDivider />
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
    </>
  );
}

function TransactionHeaderMenu({ actions }: { actions: IActionHandlers }) {
  return (
    <Dropdown size="sm">
      <TransactionActionsMenuItems actions={actions} />
    </Dropdown>
  );
}

export function TransactionOverviewHeader({
  filterProps,
  actions,
  isSticky,
  filterCount,
  onFiltersClick,
  viewMode,
}: ITransactionOverviewHeaderProps) {
  const { monthDisplay } = useTransactionHeader(filterProps.filterState);
  const { isMobile } = useResponsive();

  const badges = useTransactionFilterBadges({
    filterState: filterProps.filterState,
    tags: filterProps.tags,
    onDateFilterChange: filterProps.onDateFilterChange,
    onPriceFilterChange: filterProps.onPriceFilterChange,
    setSearchQuery: filterProps.setSearchQuery,
    setTagFilter: filterProps.setTagFilter,
    setTransactionTypeFilter: filterProps.setTransactionTypeFilter,
    setPaymentMethodFilter: filterProps.setPaymentMethodFilter,
    setCurrencyFilter: filterProps.setCurrencyFilter,
  });

  return (
    <Container className={cn("sticky top-0 z-20 min-w-0 overflow-hidden transition-all")}>
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 transition-all justify-between",
          !isSticky && "mb-3"
        )}>
        <div className="flex shrink-0 items-center gap-2 min-w-0">
          <HiArrowsRightLeft
            className={cn(
              "shrink-0 transition-all",
              isSticky ? "size-5" : "size-6"
            )}
          />
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "transition-all shrink-0",
                isSticky ? "text-base font-semibold" : "text-xl font-bold"
              )}>
              Transactions
            </span>
            {!isSticky && (
              <span className="text-sm text-text-muted font-normal self-end shrink-0">
                ({monthDisplay})
              </span>
            )}
          </div>
        </div>

        {isSticky && badges.length > 0 && (
          <ActiveFiltersRow
            badges={badges}
            onClearAll={filterProps.onClearAll}
            className="mt-0 min-w-0 flex-1 overflow-hidden"
          />
        )}

        <div className="flex shrink-0 items-center gap-2">
          {isSticky ? (
            <>
              {!isMobile && (
                <TransactionViewControls
                  {...viewMode}
                  compact
                  size="sm"
                />
              )}
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
              {isMobile && (
                <TransactionHeaderMenu actions={actions} />
              )}
            </>
          ) : (
            <>
              <Button
                clicked={actions.onCreateTransaction}
                variant="primary"
                size="sm">
                <HiPlus className="size-6" /> Add
              </Button>

              {isMobile ? (
                <TransactionHeaderMenu actions={actions} />
              ) : (
                <Dropdown>
                  <TransactionActionsMenuItems actions={actions} />
                </Dropdown>
              )}
            </>
          )}
        </div>
      </div>

      <div
        inert={isSticky ? true : undefined}
        className={cn(
          "grid transition-[grid-template-rows,opacity] ease-out",
          isSticky ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}>
        <div className={cn(isSticky && "overflow-hidden", "min-w-0")}>
          <TransactionFilters
            {...filterProps}
            viewMode={viewMode}
            hideActiveBadges={isSticky}
          />
        </div>
      </div>
    </Container>
  );
}
