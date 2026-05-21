import { workspacePath } from "@/config/routes";
import { NativeSelect } from "@/features/ui/select/native-select";
import { cn } from "@/features/util/cn";
import { useMe } from "@/features/users/hooks/useUser";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import {
  parseWorkspaceIdParam,
  workspaceIdToUrlSegment,
} from "@/features/workspace/workspace-id";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

function rebasePathname(
  pathname: string,
  fromWorkspaceSegment: string,
  toWorkspaceSegment: string,
): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && parts[0] === fromWorkspaceSegment) {
    parts[0] = toWorkspaceSegment;
    return `/${parts.join("/")}`;
  }
  const toId = parseWorkspaceIdParam(toWorkspaceSegment);
  return toId != null ? workspacePath(toId) : "/";
}

type IWorkspaceSwitcherProps = {
  className?: string;
};

export function WorkspaceSwitcher({ className }: IWorkspaceSwitcherProps) {
  const { data: me } = useMe();
  const workspaceId = useNavWorkspaceId();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const navigate = useNavigate();

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

  const handleChange = useCallback(
    (next: string | string[] | undefined) => {
      const raw = typeof next === "string" ? next : next?.[0];
      const parsed = parseWorkspaceIdParam(raw);
      if (parsed == null || workspaceId == null || parsed === workspaceId) {
        return;
      }
      const nextSeg = workspaceIdToUrlSegment(parsed);
      window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, nextSeg);
      const href = rebasePathname(
        pathname,
        currentSegment,
        nextSeg,
      );
      navigate({ to: href } as Parameters<typeof navigate>[0]);
    },
    [navigate, pathname, workspaceId, currentSegment],
  );

  if (options.length <= 1) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <NativeSelect
        label="Workspace"
        options={options}
        value={currentSegment}
        onChange={handleChange}
        className="text-sm"
      />
    </div>
  );
}
