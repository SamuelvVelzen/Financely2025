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
        "flex items-center gap-2 px-2 py-2 overflow-x-auto md:overflow-x-visible md:flex-wrap",
        className
      )}>
      <div className={cn("flex items-center gap-2 flex-nowrap md:flex-wrap")}>
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="inline-flex items-center gap-1.5">
            {badge.color ? (
              <Badge
                backgroundColor={badge.color}
                className="max-w-[200px]">
                {badge.label}

                <IconButton
                  clicked={(e) => {
                    badge.onRemove();
                  }}
                  size="xs"
                  aria-label={`Remove ${badge.type} filter`}
                  className={cn(`bg-[${badge.color}]`)}>
                  <HiX className="size-3" />
                </IconButton>
              </Badge>
            ) : (
              <Badge
                variant="default"
                className="max-w-[200px]">
                {badge.label}

                <IconButton
                  clicked={(e) => {
                    e.stopPropagation();
                    badge.onRemove();
                  }}
                  size="xs"
                  aria-label={`Remove ${badge.type} filter`}>
                  <HiX className="size-3" />
                </IconButton>
              </Badge>
            )}
          </div>
        ))}
      </div>
      <Button
        clicked={onClearAll}
        variant="default"
        size="sm"
        className="shrink-0 ml-auto md:ml-0"
        buttonContent="Clear all"
      />
    </div>
  );
}
