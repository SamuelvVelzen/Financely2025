import { cn } from "@/features/util/cn";
import { IPropsWithClassName, Never } from "@/features/util/type-helpers/props";
import React from "react";
import { Badge } from "../badge/badge";
import { BaseLink, IBaseLinkProps } from "./base-link";
import { useSidebar } from "./useSidebar";

type INavItemProps = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  customIcon?: React.ReactNode;
  badge?: number | string | null;
  postfixContent?: React.ReactNode;
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
  postfixContent,
  ...props
}: INavItemProps) {
  const { isExpanded } = useSidebar();

  const content = (
    <>
      <div
        className={cn(
          "relative transition-[margin] duration-500",
          isExpanded ? "mx-0" : "mx-4"
        )}>
        {customIcon || (Icon && <Icon className="size-6" />)}
        {badge !== undefined && badge !== null && badge !== 0 && (
          <Badge
            backgroundColor="#dc2626"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold">
            {badge}
          </Badge>
        )}
      </div>
      <span
        className={cn(
          "whitespace-nowrap text-base overflow-hidden text-left transition-[max-width,opacity,flex-basis,margin] duration-500",
          isExpanded
            ? "ml-4 flex-1 opacity-100 max-w-full"
            : "max-w-0 opacity-0 flex-basis-0"
        )}>
        {label}
      </span>
      <div
        className={cn(
          "transition-[margin,opacity] duration-500",
          isExpanded ? "ml-4 opacity-100" : "ml-0 opacity-0"
        )}>
        {postfixContent}
      </div>
    </>
  );

  const baseClasses = cn(
    "flex items-center py-3.5 rounded-2xl overflow-hidden",
    "focus-visible:ring-2 focus-visible:ring-primary",
    "transition-[padding,margin] duration-500 justify-start",
    isExpanded ? "px-1 -mx-1" : "px-0"
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

  const combinedClasses = cn(baseClasses, className);
  const combinedActiveClasses = cn(combinedClasses, activeClasses);

  return (
    <BaseLink
      to={to}
      className={cn(combinedClasses)}
      title={isExpanded ? label : label}
      inactiveProps={{ className: inactiveClasses }}
      activeProps={{ className: combinedActiveClasses }}
      {...props}>
      {content}
    </BaseLink>
  );
}
