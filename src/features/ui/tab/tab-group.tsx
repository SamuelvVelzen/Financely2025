"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  Children,
  isValidElement,
  PropsWithChildren,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Tab } from "./tab";
import { TabContent } from "./tab-content";
import { TabContext } from "./tab-context";
import { TabList } from "./tab-list";

type ITabGroupProps = IPropsWithClassName &
  PropsWithChildren & {
    defaultValue: string;
  };

export function TabGroup({
  defaultValue,
  children,
  className = "",
}: ITabGroupProps & PropsWithChildren) {
  const [value, setValue] = useState(defaultValue);
  const id = useId();
  const tabsRef = useRef<string[]>([]);
  const panelsContainerRef = useRef<HTMLDivElement>(null);

  const registerTab = (value: string) => {
    if (!tabsRef.current.includes(value)) {
      tabsRef.current.push(value);
    }
  };

  const getTabs = () => tabsRef.current;

  // Update container height based on active tab content
  useEffect(() => {
    if (!panelsContainerRef.current) return;

    const updateHeight = () => {
      if (!panelsContainerRef.current) return;

      // Find the active tab content element
      const activePanel = panelsContainerRef.current.querySelector(
        `[data-state="active"]`
      ) as HTMLElement;

      if (activePanel) {
        // Use requestAnimationFrame to ensure layout is complete
        requestAnimationFrame(() => {
          if (!panelsContainerRef.current || !activePanel) return;
          // scrollHeight works even with opacity 0 for absolutely positioned elements
          const height = activePanel.scrollHeight;
          panelsContainerRef.current.style.height = `${height}px`;
        });
      }
    };

    // Initial update after a small delay to ensure DOM is updated
    const timeoutId = setTimeout(updateHeight, 0);

    // Use ResizeObserver on the active panel to handle dynamic content changes
    let resizeObserver: ResizeObserver | null = null;

    const setupObserver = () => {
      if (!panelsContainerRef.current) return;

      const activePanel = panelsContainerRef.current.querySelector(
        `[data-state="active"]`
      ) as HTMLElement;

      if (activePanel) {
        resizeObserver = new ResizeObserver(() => {
          updateHeight();
        });
        resizeObserver.observe(activePanel);
      }
    };

    // Setup observer after a brief delay to ensure DOM is ready
    const observerTimeoutId = setTimeout(setupObserver, 50);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(observerTimeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [value]);

  // Separate Tab, TabContent, and TabList children from other children
  const childrenArray = Children.toArray(children);
  const tabChildren: React.ReactNode[] = [];
  const tabContentChildren: React.ReactNode[] = [];
  const otherChildren: React.ReactNode[] = [];

  childrenArray.forEach((child) => {
    if (
      isValidElement(child) &&
      (child.type === TabContent ||
        (child.type as any)?.displayName === "TabContent")
    ) {
      tabContentChildren.push(child);
    } else if (
      isValidElement(child) &&
      (child.type === Tab || (child.type as any)?.displayName === "Tab")
    ) {
      tabChildren.push(child);
    } else if (
      isValidElement(child) &&
      (child.type === TabList || (child.type as any)?.displayName === "TabList")
    ) {
      // If TabList is explicitly provided, render it as-is
      otherChildren.push(child);
    } else {
      otherChildren.push(child);
    }
  });

  return (
    <TabContext.Provider value={{ value, setValue, id, registerTab, getTabs }}>
      <div className={cn("w-full", className)}>
        {tabChildren.length > 0 && <TabList>{tabChildren}</TabList>}
        {otherChildren}
        {tabContentChildren.length > 0 && (
          <div
            ref={panelsContainerRef}
            className="relative w-full overflow-hidden transition-[height] duration-300 ease-in-out"
            style={{ minHeight: "1px" }}>
            {tabContentChildren}
          </div>
        )}
      </div>
    </TabContext.Provider>
  );
}
