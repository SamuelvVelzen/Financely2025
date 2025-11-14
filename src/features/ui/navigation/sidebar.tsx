import { ROUTES } from "@/config/routes";
import { useMe } from "@/features/users/hooks/useUser";
import { useEffect, useState } from "react";
import {
  HiArrowRightOnRectangle,
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiChartBar,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineTag,
  HiUser,
} from "react-icons/hi2";
import { Container } from "../container/container";
import { Logo } from "../logo/logo";
import { ThemeToggle } from "../ThemeToggle";
import { NavItem } from "./nav-item";

export function Sidebar() {
  const { data: user, isLoading, error } = useMe();

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

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-expanded", String(newState));
    }
  };

  const isExpandedContainerClasses = isExpanded ? "w-80 px-6" : "w-20 px-3";
  const containerClasses = `h-screen flex-shrink-0 transition-all duration-300 rounded-l-none py-6 flex flex-col border-r border-border ${isExpandedContainerClasses}`;

  return (
    <Container
      as="aside"
      className={containerClasses}>
      <div className="mb-6">
        {/* Logo - always visible */}
        <div className="h-10 flex items-center mb-6">
          <div className="flex items-center overflow-hidden">
            <Logo />
            <span
              className={`font-bold text-text text-lg whitespace-nowrap transition-all duration-300 overflow-hidden ${
                isExpanded
                  ? "opacity-100 ml-3 max-w-xs"
                  : "opacity-0 ml-0 max-w-0"
              }`}>
              Financely
            </span>
          </div>
        </div>

        {/* User greeting and toggle button */}
        <div className="h-12 flex items-center mb-6">
          {isExpanded ? (
            <>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-text mb-1 whitespace-nowrap">
                  Hello {user?.name}
                </h2>
                <p className="text-sm text-text-muted whitespace-nowrap">
                  {user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex items-center justify-center w-8 h-8 rounded-2xl hover:bg-background transition-all duration-300 flex-shrink-0 cursor-pointer"
                aria-label="Collapse sidebar">
                <HiChevronLeft className="w-5 h-5 text-text-muted" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex items-center justify-center w-full py-2 rounded-2xl hover:bg-surface transition-all duration-300 cursor-pointer"
              aria-label="Expand sidebar">
              <HiChevronRight className="w-5 h-5 text-text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          <li>
            <NavItem
              href={ROUTES.ROOT}
              label="Dashboard"
              icon={HiChartBar}
              isExpanded={isExpanded}
            />
          </li>
          <li>
            <NavItem
              href={ROUTES.INCOMES}
              label="Income"
              icon={HiArrowTrendingUp}
              isExpanded={isExpanded}
            />
          </li>
          <li>
            <NavItem
              href={ROUTES.EXPENSES}
              label="Expense"
              icon={HiArrowTrendingDown}
              isExpanded={isExpanded}
            />
          </li>
          <li>
            <NavItem
              href={ROUTES.TAGS}
              label="Tags"
              icon={HiOutlineTag}
            />
          </li>
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="mt-auto pt-4 space-y-4">
        {/* Bottom Actions */}
        <div className="space-y-2">
          <ThemeToggle isExpanded={isExpanded} />
          <NavItem
            href={ROUTES.ACCOUNT}
            label="Account"
            icon={HiUser}
            isExpanded={isExpanded}
            customIcon={
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">SV</span>
              </div>
            }
          />
          <NavItem
            href={ROUTES.LOGOUT}
            label="Logout"
            icon={HiArrowRightOnRectangle}
            isExpanded={isExpanded}
            isAction={true}
            className="text-danger"
          />
        </div>
      </div>
    </Container>
  );
}
