import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface SidebarContextType {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default value, will be updated from localStorage on client
  const [isExpanded, setIsExpanded] = useState(() => {
    // Safe access to localStorage on initial render (client-side only)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-expanded");
      if (saved !== null) {
        return saved === "true";
      }
    }
    return true;
  });

  useEffect(() => {
    // Read from localStorage on mount (client-side only)
    const saved = localStorage.getItem("sidebar-expanded");
    if (saved !== null) {
      setIsExpanded(saved === "true");
    }
  }, []);

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

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
