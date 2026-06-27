import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { TagHeaderDropdown } from "@/features/tag/components/tag-header-dropdown";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { SearchInput } from "@/features/ui/input/search-input";
import { cn } from "@/features/util/cn";
import {
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
  onToggleReorder: () => void;
  onSmartTaggingClick: () => void;
}

export interface ITagOverviewHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  actions: IActionHandlers;
  isReorderMode: boolean;
  isSticky: boolean;
  filterCount: number;
  onFiltersClick: () => void;
}

export function TagOverviewHeader({
  searchQuery,
  onSearchChange,
  actions,
  isReorderMode,
  isSticky,
  filterCount,
  onFiltersClick,
}: ITagOverviewHeaderProps) {
  const hasActiveFilters = searchQuery.trim().length > 0;
  const { isMobile } = useResponsive();
  const buttonSize = isMobile ? "xs" : "sm";
  const addIconClass = isMobile ? "size-3.5" : isSticky ? "size-5" : "size-6";

  return (
    <Container className={cn("sticky z-10 top-0 transition-all")}>
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
            <>
              {isMobile ? (
                <IconButton
                  clicked={actions.onCreateTag}
                  variant="primary"
                  size={buttonSize}
                  ariaLabel="Add tag">
                  <HiPlus className={addIconClass} />
                </IconButton>
              ) : (
                <Button
                  clicked={actions.onCreateTag}
                  variant="primary"
                  size={buttonSize}>
                  <HiPlus className={addIconClass} /> Add
                </Button>
              )}
              <TagHeaderDropdown
                actions={actions}
                isReorderMode={isReorderMode}
                size={buttonSize}
              />
              {hasActiveFilters && (
                <Button
                  clicked={onFiltersClick}
                  variant="primary"
                  size={buttonSize}
                  ariaLabel={`Filters (${filterCount})`}
                  buttonContent={
                    <div className="flex items-center gap-1.5">
                      <HiFunnel className={isMobile ? "size-3.5" : "size-4"} />
                      {!isMobile && <span>Filters ({filterCount})</span>}
                      {isMobile && (
                        <span className="text-xs">({filterCount})</span>
                      )}
                    </div>
                  }
                />
              )}
            </>
          ) : (
            <>
              {isMobile ? (
                <IconButton
                  clicked={actions.onCreateTag}
                  variant="primary"
                  size={buttonSize}
                  ariaLabel="Add tag">
                  <HiPlus className={addIconClass} />
                </IconButton>
              ) : (
                <Button
                  clicked={actions.onCreateTag}
                  variant="primary"
                  size={buttonSize}>
                  <HiPlus className={addIconClass} /> Add
                </Button>
              )}
              <TagHeaderDropdown
                actions={actions}
                isReorderMode={isReorderMode}
                size={buttonSize}
              />
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
          <SearchInput
            alwaysExpanded={isMobile}
            size={isMobile ? "sm" : "md"}
            className={cn(isMobile && "w-full min-w-0")}
            value={searchQuery}
            onChange={(v) => onSearchChange(v ?? "")}
            placeholder="Search tags by name, description, or color"
          />
        </div>
      </div>
    </Container>
  );
}
