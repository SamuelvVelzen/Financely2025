import { cn } from "@/features/util/cn";
import { IPropsWithClassName, Never } from "@/features/util/type-helpers/props";
import React from "react";
import { BaseLink, IBaseLinkProps } from "./base-link";
import { useSidebar } from "./useSidebar";
import { Badge } from "../badge/badge";

type INavItemProps = {
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

export function NavItem({
  className = "",
  label,
  icon: Icon,
  isAction = false,
  customIcon,
  badge,
  clicked,
  to,
  ...props
}: INavItemProps) {
  const { isExpanded } = useSidebar();

  const content = (
    <>
      <div className="relative flex-shrink-0">
        {customIcon || (Icon && <Icon className="w-6 h-6 flex-shrink-0" />)}
        {badge !== undefined && badge !== null && badge !== 0 && (
          <Badge
            backgroundColor="#dc2626"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold"
          >
            {badge}
          </Badge>
        )}
      </div>
      <span
        className={cn(
          "whitespace-nowrap text-base overflow-hidden",
          isExpanded ? "ml-4" : "hidden"
        )}>
        {label}
      </span>
    </>
  );

  const baseClasses = cn(
    "flex items-center py-3.5 rounded-3xl overflow-hidden",
    isExpanded ? "px-3 -mx-3" : "justify-center px-0"
  );

  const activeClasses = "bg-background text-text font-semibold";
  const inactiveClasses = "text-text-muted hover:bg-background hover:text-text";

  if (isAction) {
    return (
      <button
        type="button"
        className={cn(
          "w-full",
          baseClasses,
          inactiveClasses,
          "cursor-pointer",
          className
        )}
        title={isExpanded ? label : label}
        onClick={clicked}>
        {content}
      </button>
    );
  }

  const combinedClasses = cn(className, baseClasses);
  const combinedActiveClasses = cn(combinedClasses, activeClasses);

  return (
    <BaseLink
      to={to}
      className={combinedClasses}
      title={isExpanded ? label : label}
      inactiveProps={{ className: inactiveClasses }}
      activeProps={{ className: combinedActiveClasses }}
      {...props}>
      {content}
    </BaseLink>
  );
}
