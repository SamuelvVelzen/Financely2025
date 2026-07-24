import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { SearchInput } from "@/features/ui/input/search-input";
import { cn } from "@/features/util/cn";
import { HiArrowPath, HiMagnifyingGlass } from "react-icons/hi2";

export interface IActionHandlers {
  onDetectSubscriptions: () => void;
}

export interface ISubscriptionOverviewHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  actions: IActionHandlers;
  isSticky: boolean;
}

export function SubscriptionOverviewHeader({
  searchQuery,
  onSearchChange,
  actions,
  isSticky,
}: ISubscriptionOverviewHeaderProps) {
  const { isMobile } = useResponsive();
  const buttonSize = isMobile ? "xs" : "sm";
  const iconClass = isMobile ? "size-4" : isSticky ? "size-5" : "size-6";
  const showInlineSearch = !isMobile || isSticky;

  return (
    <Container className={cn("sticky z-10 top-0 transition-all")}>
      <div
        className={cn(
          "flex items-center justify-between gap-2 transition-all",
          isMobile && !isSticky && "mb-3",
        )}>
        <div className="flex gap-2 items-center shrink-0">
          <HiArrowPath
            className={cn(
              "shrink-0 transition-all",
              isSticky ? "size-5" : "size-6",
            )}
          />
          <span
            className={cn(
              "transition-all",
              isSticky ? "text-base font-semibold" : "text-xl font-bold",
            )}>
            Subscriptions
          </span>
        </div>

        <div className="flex gap-2 items-center min-w-0">
          {showInlineSearch ? (
            <SearchInput
              size={isMobile ? "sm" : "md"}
              className={cn("min-w-0", isMobile && "max-w-36")}
              value={searchQuery}
              onChange={(v) => onSearchChange(v ?? "")}
              placeholder="Search subscriptions"
            />
          ) : null}
          <Button
            clicked={actions.onDetectSubscriptions}
            variant="primary"
            size={buttonSize}
            buttonContent={
              <div className="flex items-center gap-1.5">
                <HiMagnifyingGlass className={iconClass} />
                {isMobile || isSticky ? "Detect" : "Detect Subscriptions"}
              </div>
            }
          />
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
              placeholder="Search subscriptions by name"
            />
          </div>
        </div>
      ) : null}
    </Container>
  );
}
