import { ROUTES } from "@/config/routes";
import { useUnreadCount } from "@/features/message/hooks/useUnreadCount";
import { cn } from "@/features/util/cn";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import {
  HiArrowRightOnRectangle,
  HiArrowsRightLeft,
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiChartBar,
  HiChevronRight,
  HiOutlineBell,
  HiOutlineCurrencyEuro,
  HiOutlineTag,
} from "react-icons/hi2";
import { IconButton } from "../button/icon-button";
import { Container } from "../container/container";
import { Logo } from "../logo/logo";
import { ThemeToggle } from "../ThemeToggle";
import { BaseLink } from "./base-link";
import { NavItem } from "./nav-item";
import { useSidebar } from "./useSidebar";

export function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.count || 0;
  const isExpandedContainerClasses = isExpanded ? "w-60 px-4" : "w-20 px-2";
  const containerClasses = `h-screen flex-shrink-0 rounded-l-none py-6 flex flex-col border-r border-border mb-0 ${isExpandedContainerClasses}`;
  const animationClasses = "transition-[width,margin,padding] duration-500";

  return (
    <Container
      as="aside"
      className={cn(containerClasses, animationClasses)}>
      <div
        className={cn(
          "h-10 mb-6 flex",
          "transition-[margin,max-width] duration-500",
          isExpanded ? "mx-0" : "mx-2.5"
        )}>
        <BaseLink to={ROUTES.ROOT}>
          <div className="flex items-center overflow-hidden">
            <Logo />
            <span
              className={`font-bold text-text text-lg whitespace-nowrap overflow-hidden transition-[margin,max-width] duration-500 ${
                isExpanded ? "ml-3 max-w-full" : "ml-3 max-w-0"
              }`}>
              Financely
            </span>
          </div>
        </BaseLink>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 w-full">
        <ul>
          <li>
            <NavItem
              to={ROUTES.ROOT}
              label="Dashboard"
              icon={HiChartBar}
            />
          </li>
          <li>
            <NavItem
              to={ROUTES.BUDGETS}
              label="Budgets"
              icon={HiOutlineCurrencyEuro}
            />
          </li>
          <li>
            <NavItem
              to={ROUTES.TRANSACTIONS}
              label="Transactions"
              icon={HiArrowsRightLeft}
            />
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
            <NavItem
              to={ROUTES.TAGS}
              label="Tags"
              icon={HiOutlineTag}
            />
          </li>
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="mt-auto">
        <div className={"h-px w-full border-t border-border my-2"}></div>
        <NavItem
          to={ROUTES.MESSAGES}
          label="Messages"
          icon={HiOutlineBell}
          badge={unreadCount > 0 ? unreadCount : undefined}
        />
        <div className="relative">
          <NavItem
            to={ROUTES.ACCOUNT}
            label="Account"
            className={cn(isExpanded ? "pr-4" : "")}
            customIcon={
              <div className="size-7 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-semibold">SV</span>
              </div>
            }
            postfixContent={<ThemeToggle />}
          />
          <div
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 transition-transform duration-500",
              isExpanded ? "translate-x-8" : "translate-x-6"
            )}>
            <IconButton
              clicked={toggleSidebar}
              aria-label="Toggle sidebar"
              size="sm">
              <HiChevronRight
                className={cn(
                  "size-5 transition-transform duration-300",
                  isExpanded ? "rotate-180" : ""
                )}
              />
            </IconButton>
          </div>
        </div>
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
    </Container>
  );
}
