import { ROUTES } from "@/config/routes";
import {
  HiArrowRightOnRectangle,
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiChartBar,
  HiChevronRight,
  HiOutlineTag,
  HiUser,
} from "react-icons/hi2";
import { Container } from "../container/container";
import { Logo } from "../logo/logo";
import { ThemeToggle } from "../ThemeToggle";
import { NavItem } from "./nav-item";
import { UserHeaderSidebar } from "./user-header-sidebar";
import { useSidebar } from "./useSidebar";

export function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebar();

  const isExpandedContainerClasses = isExpanded ? "w-80 px-6" : "w-20 px-3";
  const containerClasses = `h-screen flex-shrink-0 motion-safe:transition-[width,padding-left,padding-right,color,background-color,border-color] motion-safe:duration-300 motion-safe:ease-in-out rounded-l-none py-6 flex flex-col border-r border-border ${isExpandedContainerClasses}`;

  return (
    <Container
      as="aside"
      className={containerClasses}>
      <div className="flex flex-col gap-6 mb-6">
        {/* Logo - always visible */}
        <div
          className={"h-10 flex " + (isExpanded ? "items-center" : "mx-auto")}>
          <div className="flex items-center overflow-hidden">
            <Logo />
            <span
              className={`font-bold text-text text-lg whitespace-nowrap motion-safe:transition-[opacity,margin-left,max-width,color,background-color] motion-safe:duration-300 motion-safe:ease-in-out overflow-hidden ${
                isExpanded
                  ? "opacity-100 ml-3 max-w-xs"
                  : "opacity-0 ml-0 max-w-0"
              }`}>
              Financely
            </span>
          </div>
        </div>

        {/* User greeting and toggle button */}
        <div className="flex w-full items-center">
          {isExpanded ? (
            <UserHeaderSidebar />
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex items-center justify-center w-full py-2 rounded-2xl hover:bg-background cursor-pointer"
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
            />
          </li>
          <li>
            <NavItem
              href={ROUTES.INCOMES}
              label="Income"
              icon={HiArrowTrendingUp}
            />
          </li>
          <li>
            <NavItem
              href={ROUTES.EXPENSES}
              label="Expense"
              icon={HiArrowTrendingDown}
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
          <ThemeToggle />
          <NavItem
            href={ROUTES.ACCOUNT}
            label="Account"
            icon={HiUser}
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
            isAction={true}
            className="text-danger"
          />
        </div>
      </div>
    </Container>
  );
}
