import { cn } from "@/util/cn";
import { IPropsWithClassName, Never } from "@/util/type-helpers/props";
import React from "react";
import { BaseLink, IBaseLinkProps } from "./base-link";
import { useSidebar } from "./useSidebar";

type INavItemProps = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  customIcon?: React.ReactNode;
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
  clicked,
  to,
  ...props
}: INavItemProps) {
  const { isExpanded } = useSidebar();

  const content = (
    <>
      {customIcon || (Icon && <Icon className="w-6 h-6 flex-shrink-0" />)}
      <span
        className={cn(
          "whitespace-nowrap text-base motion-safe:transition-[opacity,margin-left,max-width,color,background-color] motion-safe:duration-300 overflow-hidden",
          isExpanded ? "opacity-100 ml-4 max-w-xs" : "opacity-0 ml-0 max-w-0"
        )}
      >
        {label}
      </span>
    </>
  );

  const baseClasses = cn(
    "flex items-center py-3.5 rounded-3xl motion-safe:transition-[padding-left,padding-right,color,background-color,border-color] motion-safe:duration-300 overflow-hidden",
    isExpanded ? "px-4" : "justify-center px-0"
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
        onClick={clicked}
      >
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
      {...props}
    >
      {content}
    </BaseLink>
  );
}
