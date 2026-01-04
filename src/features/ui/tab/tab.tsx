import { Button } from "@/features/ui/button/button";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren, useEffect, type KeyboardEvent } from "react";
import { HiExclamationTriangle } from "react-icons/hi2";
import { useTabContext } from "./tab-context";

type ITabProps = IPropsWithClassName &
  PropsWithChildren & {
    value: string;
    showWarning?: boolean;
  };

export function Tab({
  value,
  children,
  className = "",
  showWarning = false,
}: ITabProps) {
  const {
    value: activeValue,
    setValue,
    id,
    registerTab,
    getTabs,
  } = useTabContext();
  const isActive = activeValue === value;
  const triggerId = `${id}-trigger-${value}`;
  const panelId = `${id}-panel-${value}`;

  useEffect(() => {
    registerTab(value);
  }, [value, registerTab]);

  const tabs = getTabs();
  const currentIndex = tabs.indexOf(value);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === tabs.length - 1;

  const handleClick = () => {
    setValue(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const tabs = getTabs();
      const currentIndex = tabs.indexOf(value);

      if (currentIndex === -1) return;

      let nextIndex: number;
      if (e.key === "ArrowLeft") {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else {
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      }

      const nextValue = tabs[nextIndex];
      if (nextValue) {
        setValue(nextValue);
        // Focus the next tab trigger
        const nextTriggerId = `${id}-trigger-${nextValue}`;
        const nextTrigger = document.getElementById(nextTriggerId);
        nextTrigger?.focus();
      }
    }
  };

  return (
    <div className="flex-1">
      <Button
        type="button"
        variant="default"
        size="md"
        clicked={handleClick}
        onKeyDown={handleKeyDown}
        role="tab"
        id={triggerId}
        aria-selected={isActive}
        aria-controls={panelId}
        data-state={isActive ? "active" : "inactive"}
        className={cn(
          "w-full border-0 border-b-2 bg-transparent px-4 py-2 font-medium transition-colors",
          isFirst && "rounded-tl-2xl rounded-tr-none rounded-b-none",
          isLast && "rounded-tr-2xl rounded-tl-none rounded-b-none",
          !isFirst && !isLast && "rounded-none",
          isActive
            ? "border-primary text-text"
            : "border-transparent text-text-muted hover:text-text hover:border-border",

          className
        )}>
        <div className="flex items-center gap-2">
          {children}
          {showWarning && (
            <HiExclamationTriangle className="size-4 text-warning" />
          )}
        </div>
      </Button>
    </div>
  );
}

Tab.displayName = "Tab";
