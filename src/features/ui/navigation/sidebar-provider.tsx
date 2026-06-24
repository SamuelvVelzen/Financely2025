import { useCallback, useMemo, useState } from "react";
import { SidebarContext } from "./sidebar-context";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-expanded");
      if (saved !== null) {
        return saved === "true";
      }
    }
    return true;
  });

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => {
      const newState = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar-expanded", String(newState));
      }
      return newState;
    });
  }, []);

  const value = useMemo(
    () => ({ isExpanded, toggleSidebar }),
    [isExpanded, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
