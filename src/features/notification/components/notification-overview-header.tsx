import { NotificationFilters } from "@/features/notification/components/notification-filters";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import type { INotificationType } from "@/features/shared/validation/enums";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { cn } from "@/features/util/cn";
import { HiFunnel, HiOutlineBell } from "react-icons/hi2";
import type { INotificationStatusFilter } from "../utils/notification-filter-query-schema";

export interface INotificationOverviewHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  status: INotificationStatusFilter;
  type: INotificationType | undefined;
  onStatusChange: (status: INotificationStatusFilter) => void;
  onTypeChange: (type: INotificationType | undefined) => void;
  isSticky: boolean;
  hasActiveFilters: boolean;
  filterCount: number;
  onFiltersClick: () => void;
  showMarkAllAsRead: boolean;
  isMarkingAllAsRead: boolean;
  onMarkAllAsRead: () => void;
}

export function NotificationOverviewHeader({
  searchQuery,
  onSearchChange,
  status,
  type,
  onStatusChange,
  onTypeChange,
  isSticky,
  hasActiveFilters,
  filterCount,
  onFiltersClick,
  showMarkAllAsRead,
  isMarkingAllAsRead,
  onMarkAllAsRead,
}: INotificationOverviewHeaderProps) {
  const { isMobile } = useResponsive();
  const buttonSize = isMobile ? "xs" : "sm";

  return (
    <Container className={cn("sticky z-10 top-0 transition-all")}>
      <div
        className={cn(
          "flex items-center justify-between gap-2 transition-all",
          !isSticky && "mb-3",
        )}>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <HiOutlineBell
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
              Notifications
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isSticky ? (
            <Button
              clicked={onFiltersClick}
              variant={hasActiveFilters ? "primary" : "default"}
              size={buttonSize}
              ariaLabel={
                hasActiveFilters ? `Filters (${filterCount})` : "Filters"
              }
              buttonContent={
                <div className="flex items-center gap-1.5">
                  <HiFunnel className="size-4" />
                  {!isMobile && (
                    <span>
                      Filters
                      {hasActiveFilters ? ` (${filterCount})` : ""}
                    </span>
                  )}
                  {isMobile && hasActiveFilters ? (
                    <span className="text-xs">({filterCount})</span>
                  ) : null}
                </div>
              }
            />
          ) : null}
          {showMarkAllAsRead ? (
            <Button
              size={buttonSize}
              className="shrink-0"
              clicked={onMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              loading={{
                isLoading: isMarkingAllAsRead,
                text: "Marking all notifications as read",
              }}
              buttonContent={isMobile || isSticky ? "Mark all" : "Mark all as read"}
            />
          ) : null}
        </div>
      </div>

      <div
        inert={isSticky ? true : undefined}
        className={cn(
          "grid transition-[grid-template-rows,opacity] ease-out",
          isSticky
            ? "grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100",
        )}>
        <div className={cn(isSticky && "overflow-hidden", "min-w-0")}>
          <NotificationFilters
            className="mb-0"
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            status={status}
            type={type}
            onStatusChange={onStatusChange}
            onTypeChange={onTypeChange}
          />
        </div>
      </div>
    </Container>
  );
}
