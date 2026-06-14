import { queryKeys } from "@/features/shared/query/keys";
import type { IWorkspaceSummary } from "@/features/shared/validation/schemas";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { Label } from "@/features/ui/typography/label";
import { useMe } from "@/features/users/hooks/useUser";
import { cn } from "@/features/util/cn";
import { AddOrEditWorkspaceDialog } from "@/features/workspace/components/add-or-edit-workspace-dialog";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { buildWorkspaceNavigateTarget } from "@/features/workspace/utils/workspace-navigate-target";
import {
  parseWorkspaceIdParam,
  workspaceIdToUrlSegment,
} from "@/features/workspace/workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { HiChevronDown, HiPlus } from "react-icons/hi2";

const MAX_WORKSPACES_ALLOWED = 5;

type IWorkspaceSwitcherProps = {
  className?: string;
  /** Hides visible label; keeps an accessible name for screen readers. */
  compact?: boolean;
};

export function WorkspaceSwitcher({
  className,
  compact = false,
}: IWorkspaceSwitcherProps) {
  const { data: me } = useMe();
  const workspaceId = useNavWorkspaceId();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const options = useMemo(
    () =>
      (me?.workspaces ?? []).map((w) => ({
        value: workspaceIdToUrlSegment(w.id),
        label: w.name,
      })),
    [me?.workspaces],
  );

  const currentSegment =
    workspaceId != null ? workspaceIdToUrlSegment(workspaceId) : "";

  const selectedLabel =
    options.find((o) => o.value === currentSegment)?.label ?? "Workspace";

  const navigateToWorkspace = useCallback(
    (targetWorkspaceId: number) => {
      const nextSeg = workspaceIdToUrlSegment(targetWorkspaceId);
      window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, nextSeg);
      const target = buildWorkspaceNavigateTarget(pathname, targetWorkspaceId);
      // #region agent log
      fetch('http://127.0.0.1:7777/ingest/e8283802-7016-4e24-aa58-f03056da6757', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '79443d' }, body: JSON.stringify({ sessionId: '79443d', runId: 'post-fix', location: 'workspace-switcher.tsx:navigateToWorkspace', message: 'workspace switch navigate', data: { pathname, currentSegment, nextSeg, target, targetWorkspaceId }, timestamp: Date.now(), hypothesisId: 'B-C' }) }).catch(() => { });
      // #endregion
      if (target) {
        navigate({ to: target.to, params: target.params });
      }
    },
    [navigate, pathname, currentSegment],
  );

  const handleSelectWorkspace = useCallback(
    (segment: string) => {
      const parsed = parseWorkspaceIdParam(segment);
      if (parsed == null || workspaceId == null || parsed === workspaceId) {
        return;
      }
      navigateToWorkspace(parsed);
    },
    [workspaceId, navigateToWorkspace],
  );

  const handleWorkspaceCreated = useCallback(
    (created?: IWorkspaceSummary) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      setIsCreateDialogOpen(false);
      if (created) {
        navigateToWorkspace(created.id);
      }
    },
    [queryClient, navigateToWorkspace],
  );

  const handleCreateClick = () => {
    setIsOpen(false);
    setIsCreateDialogOpen(true);
  };

  if (options.length === 0) {
    return null;
  }

  const selectorButton = (
    <>
      <span className="flex-1 text-left whitespace-nowrap truncate">
        {selectedLabel}
      </span>
      <HiChevronDown
        className={cn(
          "size-5 shrink-0 transition-transform duration-200 text-text-muted",
          isOpen && "rotate-180",
        )}
        aria-hidden="true"
      />
    </>
  );

  return (
    <div
      className={cn(
        compact ? "min-w-0 max-w-[9rem] sm:max-w-[11rem]" : "w-full",
        className,
      )}>
      {compact ? (
        <Label className="sr-only">Workspace</Label>
      ) : (
        <Label className="mb-1">Workspace</Label>
      )}
      <Dropdown
        dropdownSelector={selectorButton}
        open={isOpen}
        onOpenChange={setIsOpen}
        selectorClassName={cn("text-sm", compact && "text-xs")}>
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            clicked={() => handleSelectWorkspace(option.value)}
            selected={option.value === currentSegment}>
            {option.label}
          </DropdownItem>
        ))}
        {
          options.length < MAX_WORKSPACES_ALLOWED && (


            <Dropdown.Footer>
              <DropdownItem
                clicked={handleCreateClick}
                className="text-primary font-medium hover:bg-primary/10">
                <span className="flex items-center gap-2 w-full">
                  <HiPlus className="size-4 shrink-0" aria-hidden="true" />
                  Create new workspace
                </span>
              </DropdownItem>
            </Dropdown.Footer>
          )
        }
      </Dropdown>

      <AddOrEditWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  );
}
