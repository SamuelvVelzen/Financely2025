import { ROUTES } from "@/config/routes";
import { useUnreadCount } from "@/features/message/hooks/useUnreadCount";
import { formatUnreadBadgeLabel } from "@/features/message/utils/format-unread-badge-label";
import { useProfileAvatar } from "@/features/users/hooks/useProfileAvatar";
import { cn } from "@/features/util/cn";
import { WorkspaceSwitcher } from "@/features/workspace/components/workspace-switcher";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { signOutFromApp } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import {
  HiArrowPath,
  HiArrowRightOnRectangle,
  HiOutlineBell,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { Container } from "../container/container";
import { Dropdown } from "../dropdown/dropdown";
import { DropdownItem } from "../dropdown/dropdown-item";
import { Logo } from "../logo/logo";
import { Skeleton } from "../skeleton";
import { ThemeToggle } from "../ThemeToggle";
import { BaseLink } from "./base-link";

export function MobileTopNav() {
  const { isLoading: profileLoading, initials } = useProfileAvatar();
  const navigate = useNavigate();
  const workspaceId = useNavWorkspaceId();
  const workspaceParams = { workspaceId: workspaceIdToRouteParam(workspaceId) };
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.count || 0;

  const handleLogout = async () => {
    await signOutFromApp({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: ROUTES.ROOT });
        },
      },
    });
  };

  const avatarContent = (
    <div className="size-8 bg-primary rounded-full flex items-center justify-center shrink-0 overflow-hidden">
      {profileLoading ? (
        <Skeleton className="size-full" rounded="full" />
      ) : (
        <span className="text-white text-xs font-semibold">{initials}</span>
      )}
    </div>
  );

  return (
    <Container
      as="header"
      className={cn(
        "md:hidden",
        "fixed top-0 left-0 right-0 z-50",
        "h-16",
        "border-t-0 rounded-t-none",
        "flex items-center justify-between"
      )}>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <BaseLink
          to="/$workspaceId"
          params={workspaceParams}
          className="shrink-0">
          <Logo />
        </BaseLink>
        <WorkspaceSwitcher compact />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />

        <Dropdown
          dropdownSelector={avatarContent}
          placement="bottom"
          size="sm">
          <DropdownItem
            text="Account"
            icon={<HiOutlineUserCircle className="size-5" />}
            clicked={() => {
              navigate({ to: ROUTES.ACCOUNT });
            }}
          />
          <DropdownItem
            text="Messages"
            icon={
              <div className="relative">
                <HiOutlineBell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-danger text-white rounded-full">
                    {formatUnreadBadgeLabel(unreadCount)}
                  </span>
                )}
              </div>
            }
            clicked={() => {
              navigate({
                to: "/$workspaceId/messages",
                params: workspaceParams,
              });
            }}
          />
          <DropdownItem
            text="Subscriptions"
            icon={<HiArrowPath className="size-5" />}
            clicked={() => {
              navigate({
                to: "/$workspaceId/subscriptions",
                params: workspaceParams,
              });
            }}
          />
          <DropdownItem
            text="Logout"
            icon={<HiArrowRightOnRectangle className="size-5" />}
            clicked={handleLogout}
            className="text-danger hover:text-danger-hover"
          />
        </Dropdown>

      </div>
    </Container>
  );
}
