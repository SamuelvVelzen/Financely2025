import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { SearchInput } from "@/features/ui/input/search-input";
import { cn } from "@/features/util/cn";
import { HiPlus, HiUsers } from "react-icons/hi2";

export function SplitsOverviewHeader({
  searchQuery,
  onSearchChange,
  onCreateClick,
  isSticky,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
  isSticky: boolean;
}) {
  const { isMobile } = useResponsive();
  const buttonSize = isMobile ? "xs" : "sm";
  const addIconClass = isMobile ? "size-4" : isSticky ? "size-5" : "size-6";
  const showInlineSearch = !isMobile || isSticky;

  return (
    <Container className={cn("sticky z-10 top-0 transition-all")}>
      <div
        className={cn(
          "flex items-center justify-between gap-2 transition-all",
          isMobile && !isSticky && "mb-3",
        )}>
        <div className="flex gap-2 items-center shrink-0">
          <HiUsers
            className={cn(
              "shrink-0 transition-all",
              isSticky ? "size-5" : "size-6",
            )}
          />
          <div>
            <span
              className={cn(
                "transition-all block",
                isSticky ? "text-base font-semibold" : "text-xl font-bold",
              )}>
              Splits
            </span>
            {!isSticky ? (
              <p className="text-sm text-text-muted">
                Shared expenses with friends
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2 items-center min-w-0">
          {showInlineSearch ? (
            <SearchInput
              size={isMobile ? "sm" : "md"}
              className={cn("min-w-0", isMobile && "max-w-36")}
              value={searchQuery}
              onChange={(v) => onSearchChange(v ?? "")}
              placeholder="Search splits"
            />
          ) : null}
          {isMobile ? (
            <IconButton
              clicked={onCreateClick}
              variant="primary"
              size={buttonSize}
              ariaLabel="New split group">
              <HiPlus className="size-4" />
            </IconButton>
          ) : (
            <Button
              clicked={onCreateClick}
              variant="primary"
              size={buttonSize}>
              <HiPlus className={addIconClass} /> New group
            </Button>
          )}
        </div>
      </div>

      {isMobile ? (
        <div
          inert={isSticky ? true : undefined}
          className={cn(
            "grid transition-[grid-template-rows,opacity] ease-out",
            isSticky
              ? "grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100",
          )}>
          <div className={cn(isSticky && "overflow-hidden", "min-w-0")}>
            <SearchInput
              alwaysExpanded
              size="sm"
              className="w-full min-w-0"
              value={searchQuery}
              onChange={(v) => onSearchChange(v ?? "")}
              placeholder="Search splits by name"
            />
          </div>
        </div>
      ) : null}
    </Container>
  );
}
