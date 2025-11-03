import { Link, useLocation } from "@tanstack/react-router";
import React from "react";

interface NavItemProps {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isExpanded: boolean;
  isAction?: boolean;
  customIcon?: React.ReactNode;
}

export function NavItem({
  href,
  label,
  icon: Icon,
  isExpanded,
  isAction = false,
  customIcon,
}: NavItemProps) {
  const { pathname } = useLocation();

  const isActive = () => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const content = (
    <>
      {customIcon || (Icon && <Icon className="w-6 h-6 flex-shrink-0" />)}
      <span
        className={`whitespace-nowrap text-base transition-all duration-300 overflow-hidden ${
          isExpanded ? "opacity-100 ml-4 max-w-xs" : "opacity-0 ml-0 max-w-0"
        }`}>
        {label}
      </span>
    </>
  );

  const baseClasses = `flex items-center py-3.5 rounded-3xl transition-all duration-300 overflow-hidden ${
    isExpanded ? "px-4" : "justify-center px-0"
  }`;

  const stateClasses = isAction
    ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
    : isActive()
      ? "bg-surface text-text font-semibold"
      : "text-text-muted hover:bg-surface hover:text-text";

  if (isAction) {
    return (
      <button
        type="button"
        className={`w-full ${baseClasses} ${stateClasses} cursor-pointer`}
        title={isExpanded ? label : label}>
        {content}
      </button>
    );
  }

  return (
    <Link
      to={href}
      className={`${baseClasses} ${stateClasses}`}
      title={isExpanded ? label : label}
      preload="intent"
      activeProps={{ className: `${baseClasses} ${stateClasses}` }}
      hash={undefined}
      search={undefined}>
      {content}
    </Link>
  );
}
