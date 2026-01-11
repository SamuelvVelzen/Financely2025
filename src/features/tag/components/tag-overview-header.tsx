import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { SearchInput } from "@/features/ui/input/search-input";
import { cn } from "@/features/util/cn";
import {
  HiArrowDownTray,
  HiFunnel,
  HiOutlineTag,
  HiPlus,
} from "react-icons/hi2";

/**
 * Action handlers for tag header
 */
export interface IActionHandlers {
  onCreateTag: () => void;
  onCsvImportClick: () => void;
}

export interface ITagOverviewHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  actions: IActionHandlers;
  isSticky: boolean;
  filterCount: number;
  onFiltersClick: () => void;
}

export function TagOverviewHeader({
  searchQuery,
  onSearchChange,
  actions,
  isSticky,
  filterCount,
  onFiltersClick,
}: ITagOverviewHeaderProps) {
  const hasActiveFilters = searchQuery.trim().length > 0;

  return (
    <Container className={cn("sticky z-10 top-0 transition-all")}>
      {/* Title section - animates between sizes */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 transition-all",
          !isSticky && "mb-3"
        )}>
        <div className="flex gap-2 items-center">
          <HiOutlineTag
            className={cn(
              "shrink-0 transition-all",
              isSticky ? "size-5" : "size-6"
            )}
          />
          <span
            className={cn(
              "transition-all",
              isSticky ? "text-base font-semibold" : "text-xl font-bold"
            )}>
            Tags
          </span>
        </div>

        <div className="flex gap-2 items-center">
          {isSticky ? (
            // Sticky: Show Add button + Dropdown + Filters button (if search active)
            <>
              <Button
                clicked={actions.onCreateTag}
                variant="primary"
                size="sm">
                <HiPlus className="size-5" /> Add
              </Button>
              <Dropdown>
                <DropdownItem
                  icon={<HiArrowDownTray />}
                  clicked={actions.onCsvImportClick}>
                  Import from CSV
                </DropdownItem>
              </Dropdown>
              {hasActiveFilters && (
                <Button
                  clicked={onFiltersClick}
                  variant="primary"
                  size="sm"
                  buttonContent={
                    <div className="flex items-center gap-2">
                      <HiFunnel className="size-4" />
                      <span>Filters ({filterCount})</span>
                    </div>
                  }
                />
              )}
            </>
          ) : (
            // Expanded: Show Add button + Dropdown
            <>
              <Button
                clicked={actions.onCreateTag}
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
              </Dropdown>
            </>
          )}
        </div>
      </div>

      {/* Filters section - animates height and opacity when sticky */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] ease-out",
          isSticky ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}>
        <div className={cn(isSticky && "overflow-hidden")}>
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search tags by name, description, or color..."
          />
        </div>
      </div>
    </Container>
  );
}
