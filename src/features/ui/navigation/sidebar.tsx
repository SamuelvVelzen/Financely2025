import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import {
  HiArrowRightOnRectangle,
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiChartBar,
  HiOutlineTag,
  HiUser,
} from "react-icons/hi2";
import { Container } from "../container/container";
import { Logo } from "../logo/logo";
import { ThemeToggle } from "../ThemeToggle";
import { BaseLink } from "./base-link";
import { NavItem } from "./nav-item";
import { UserHeaderSidebar } from "./user-header-sidebar";
import { useSidebar } from "./useSidebar";

export function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const isExpandedContainerClasses = isExpanded ? "w-80 px-6" : "w-20 px-3";
  const containerClasses = `h-screen flex-shrink-0 rounded-l-none py-6 flex flex-col border-r border-border ${isExpandedContainerClasses}`;

  return (
    <Container as="aside" className={containerClasses}>
      <div className="flex flex-col gap-6 mb-6">
        {/* Logo - always visible */}
        <div
          className={"h-10 flex " + (isExpanded ? "items-center" : "mx-auto")}
        >
          <BaseLink to={ROUTES.ROOT}>
            <div className="flex items-center overflow-hidden">
              <Logo />
              <span
                className={`font-bold text-text text-lg whitespace-nowrap overflow-hidden ${
                  isExpanded ? "ml-3" : "hidden"
                }`}
              >
                Financely
              </span>
            </div>
          </BaseLink>
        </div>

        {/* User greeting and toggle button */}

        <UserHeaderSidebar />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1">
        <ul>
          <li>
            <NavItem to={ROUTES.ROOT} label="Dashboard" icon={HiChartBar} />
          </li>
          <li>
            <NavItem
              to={ROUTES.INCOMES}
              label="Income"
              icon={HiArrowTrendingUp}
            />
          </li>
          <li>
            <NavItem
              to={ROUTES.EXPENSES}
              label="Expense"
              icon={HiArrowTrendingDown}
            />
          </li>
          <li>
            <NavItem to={ROUTES.TAGS} label="Tags" icon={HiOutlineTag} />
          </li>
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="mt-auto pt-4 space-y-4">
        {/* Bottom Actions */}
        <div>
          <ThemeToggle />
          <NavItem
            to={ROUTES.ACCOUNT}
            label="Account"
            icon={HiUser}
            customIcon={
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">SV</span>
              </div>
            }
          />
          <NavItem
            label="Logout"
            icon={HiArrowRightOnRectangle}
            isAction={true}
            clicked={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({ to: ROUTES.ROOT });
                  },
                },
              });
            }}
            className="text-danger hover:text-danger-hover"
          />
        </div>
      </div>
    </Container>
  );
}
