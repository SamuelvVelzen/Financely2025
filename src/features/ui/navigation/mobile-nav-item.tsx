import { cn } from "@/features/util/cn";
import { IPropsWithClassName, Never } from "@/features/util/type-helpers/props";
import React from "react";
import { Badge } from "../badge/badge";
import { BaseLink, IBaseLinkProps } from "./base-link";

type IMobileNavItemProps = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  customIcon?: React.ReactNode;
  badge?: number | string | null;
} & IPropsWithClassName &
  (
    | ({
        isAction: true;
        clicked: () => void;
        to?: never;
      } & Never<Omit<IBaseLinkProps, "className">>)
    | ({
        isAction?: false;
        clicked?: never;
        to: NonNullable<IBaseLinkProps["to"]>;
      } & IBaseLinkProps)
  );

export function MobileNavItem({
  className = "",
  label,
  icon: Icon,
  isAction = false,
  customIcon,
  badge,
  clicked,
  to,
  ...props
}: IMobileNavItemProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-1 min-w-0 flex-1">
      <div className="relative">
        {customIcon || (Icon && <Icon className="size-5" />)}
        {badge !== undefined && badge !== null && badge !== 0 && (
          <Badge
            backgroundColor="#dc2626"
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold">
            {badge}
          </Badge>
        )}
      </div>
      <span className="text-[10px] font-medium text-center truncate w-full">
        {label}
      </span>
    </div>
  );

  const baseClasses = cn(
    "flex flex-col items-center justify-center",
    "min-h-[44px] h-full px-2 py-1.5",
    "rounded-2xl",
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "transition-colors"
  );

  const activeClasses = "bg-background text-text";
  const inactiveClasses = "text-text-muted active:bg-background";

  if (isAction) {
    return (
      <button
        type="button"
        className={cn(
          baseClasses,
          inactiveClasses,
          "cursor-pointer",
          className
        )}
        onClick={clicked}
        aria-label={label}>
        {content}
      </button>
    );
  }

  const combinedClasses = cn(baseClasses, className);
  const combinedActiveClasses = cn(combinedClasses, activeClasses);

  return (
    <BaseLink
      to={to}
      className={cn(combinedClasses)}
      aria-label={label}
      inactiveProps={{ className: inactiveClasses }}
      activeProps={{ className: combinedActiveClasses }}
      {...props}>
      {content}
    </BaseLink>
  );
}
