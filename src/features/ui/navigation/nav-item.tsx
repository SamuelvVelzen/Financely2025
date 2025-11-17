import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { Link } from "@tanstack/react-router";
import React from "react";
import { useIsActiveLink } from "./useIsActiveLink";
import { useSidebar } from "./useSidebar";

type INavItemProps = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isAction?: boolean;
  customIcon?: React.ReactNode;
} & IPropsWithClassName;

export function NavItem({
  className = "",
  href,
  label,
  icon: Icon,
  isAction = false,
  customIcon,
}: INavItemProps) {
  const { isActive } = useIsActiveLink(href);
  const { isExpanded } = useSidebar();

  const content = (
    <>
      {customIcon || (Icon && <Icon className="w-6 h-6 flex-shrink-0" />)}
      <span
        className={cn(
          "whitespace-nowrap text-base motion-safe:transition-[opacity,margin-left,max-width,color,background-color] motion-safe:duration-300 overflow-hidden",
          isExpanded ? "opacity-100 ml-4 max-w-xs" : "opacity-0 ml-0 max-w-0"
        )}>
        {label}
      </span>
    </>
  );

  const baseClasses = cn(
    "flex items-center py-3.5 rounded-3xl motion-safe:transition-[padding-left,padding-right,color,background-color,border-color] motion-safe:duration-300 overflow-hidden",
    isExpanded ? "px-4" : "justify-center px-0"
  );

  const stateClasses = isActive
    ? "bg-background text-text font-semibold"
    : "text-text-muted hover:bg-background hover:text-text";

  if (isAction) {
    return (
      <button
        type="button"
        className={cn(
          "w-full",
          baseClasses,
          stateClasses,
          "cursor-pointer",
          className
        )}
        title={isExpanded ? label : label}>
        {content}
      </button>
    );
  }

  const combinedClasses = cn(className, baseClasses, stateClasses);

  return (
    <Link
      to={href}
      className={combinedClasses}
      title={isExpanded ? label : label}
      preload="intent"
      activeProps={{ className: combinedClasses }}
      hash={undefined}
      search={undefined}>
      {content}
    </Link>
  );
}
