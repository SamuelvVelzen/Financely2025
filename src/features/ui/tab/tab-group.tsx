import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  Children,
  forwardRef,
  isValidElement,
  PropsWithChildren,
  useEffect,
  useId,
  useImperativeHandle,
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
    tabs?: string[];
    onChangeTab?: (previousTab: string, newTab: string) => void;
  };

export interface ITabGroupRef {
  goNext: () => void;
  goBack: () => void;
  getTabs: () => string[];
}

export const TabGroup = forwardRef<
  ITabGroupRef,
  ITabGroupProps & PropsWithChildren
>(({ defaultValue, children, className = "", tabs, onChangeTab }, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const id = useId();
  const tabsRef = useRef<string[]>([]);
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);

  // Wrapped setValue that handles onChangeTab callback and transition logic
  const setValue = (newValue: string) => {
    const previousValue = internalValue;

    // Only proceed if value actually changed
    if (previousValue !== newValue) {
      // Call onChangeTab callback if provided
      onChangeTab?.(previousValue, newValue);

      // Update the value
      setInternalValue(newValue);

      // Enable transition
      setIsTransitioning(true);
      isTransitioningRef.current = true;

      // Disable transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }, 200);
    }
  };

  const registerTab = (value: string) => {
    if (!tabsRef.current.includes(value)) {
      tabsRef.current.push(value);
    }
  };

  // Use provided tabs array or fall back to registered tabs
  const getTabs = () => {
    if (tabs && tabs.length > 0) {
      return tabs;
    }
    return tabsRef.current;
  };

  // Navigation functions
  const goNext = () => {
    const tabList = getTabs();
    const currentIndex = tabList.indexOf(value);
    if (currentIndex < tabList.length - 1) {
      const nextTab = tabList[currentIndex + 1];
      setValue(nextTab);
    }
  };

  const goBack = () => {
    const tabList = getTabs();
    const currentIndex = tabList.indexOf(value);
    if (currentIndex > 0) {
      const previousTab = tabList[currentIndex - 1];
      setValue(previousTab);
    }
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    goNext,
    goBack,
    getTabs,
  }));

  // Use internalValue as value
  const value = internalValue;

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
    // This will animate if isTransitioning is true
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
          // Only update height if we're not transitioning (content resize, not tab change)
          // Use ref to avoid dependency on isTransitioning state
          if (!isTransitioningRef.current) {
            updateHeight();
          }
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

  // Sort tabChildren and tabContentChildren based on tabs array order if provided
  const sortByTabsOrder = (children: React.ReactNode[]): React.ReactNode[] => {
    if (!tabs || tabs.length === 0) return children;

    return [...children].sort((a, b) => {
      if (!isValidElement(a) || !isValidElement(b)) return 0;
      const aValue = (a.props as any)?.value;
      const bValue = (b.props as any)?.value;
      const aIndex = tabs.indexOf(aValue);
      const bIndex = tabs.indexOf(bValue);
      // If tab not found in array, keep original order
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  const sortedTabChildren = sortByTabsOrder(tabChildren);
  const sortedTabContentChildren = sortByTabsOrder(tabContentChildren);

  return (
    <TabContext.Provider
      value={{ value, setValue, id, registerTab, getTabs, goNext, goBack }}>
      <div className={cn("w-full", className)}>
        {sortedTabChildren.length > 0 && <TabList>{sortedTabChildren}</TabList>}
        {otherChildren}
        {sortedTabContentChildren.length > 0 && (
          <div
            ref={panelsContainerRef}
            className={cn(
              "relative w-full",
              isTransitioning && "transition-[height] duration-300 ease-in-out"
            )}
            style={{ minHeight: "1px" }}>
            {sortedTabContentChildren}
          </div>
        )}
      </div>
    </TabContext.Provider>
  );
});

TabGroup.displayName = "TabGroup";
