import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/features/util/cn";
import { HiX } from "react-icons/hi";
import type { IFilterBadge } from "../utils/filter-badges";

export interface IActiveFiltersRowProps {
  badges: IFilterBadge[];
  onClearAll: () => void;
  className?: string;
}

export function ActiveFiltersRow({
  badges,
  onClearAll,
  className,
}: IActiveFiltersRowProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-2 flex min-w-0 w-full items-center gap-2",
        className
      )}>
      <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex w-max flex-nowrap items-center gap-2 pr-1">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="inline-flex shrink-0 items-center gap-1.5">
              {badge.color ? (
                <Badge
                  backgroundColor={badge.color}
                  className="max-w-[200px]">
                  {badge.emoticon && (
                    <span className="shrink-0">{badge.emoticon}</span>
                  )}
                  {badge.label}

                  <IconButton
                    clicked={() => {
                      badge.onRemove();
                    }}
                    size="xs"
                    ariaLabel={`Remove ${badge.type} filter`}
                    className={cn(`bg-[${badge.color}]`)}>
                    <HiX className="size-3" />
                  </IconButton>
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className="max-w-[200px]">
                  {badge.emoticon && (
                    <span className="shrink-0">{badge.emoticon}</span>
                  )}
                  {badge.label}

                  <IconButton
                    clicked={(e) => {
                      e.stopPropagation();
                      badge.onRemove();
                    }}
                    size="xs"
                    ariaLabel={`Remove ${badge.type} filter`}>
                    <HiX className="size-3" />
                  </IconButton>
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
      <Button
        clicked={onClearAll}
        variant="default"
        size="sm"
        className="shrink-0"
        buttonContent="Clear all"
      />
    </div>
  );
}
