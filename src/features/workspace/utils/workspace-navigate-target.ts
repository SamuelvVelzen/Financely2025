import { ROUTES } from "@/config/routes";
import {
  parseWorkspaceIdParam,
  workspaceIdToUrlSegment,
  type IWorkspaceId,
} from "@/features/workspace/workspace-id";

type IWorkspaceNavigateTarget = {
  to: string;
  params: Record<string, string>;
};

const NON_WORKSPACE_ROOT_SEGMENTS = new Set<string>([
  ROUTES.ACCOUNT.slice(1),
  ROUTES.ONBOARDING.slice(1),
]);

/**
 * Builds a typed TanStack Router target when switching workspace on a
 * workspace-scoped URL. Returns null on non-workspace pages (localStorage only).
 */
export function buildWorkspaceNavigateTarget(
  pathname: string,
  targetWorkspaceId: IWorkspaceId,
): IWorkspaceNavigateTarget | null {
  const workspaceId = workspaceIdToUrlSegment(targetWorkspaceId);
  const params: Record<string, string> = { workspaceId };
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { to: "/$workspaceId", params };
  }

  const root = parts[0]!;
  if (NON_WORKSPACE_ROOT_SEGMENTS.has(root)) {
    return null;
  }

  if (parseWorkspaceIdParam(root) === null) {
    return null;
  }

  const rest = parts.slice(1);
  if (rest.length === 0) {
    return { to: "/$workspaceId", params };
  }

  if (rest[0] === "budgets") {
    if (rest[1] === "new") {
      return { to: "/$workspaceId/budgets/new", params };
    }
    if (rest.length === 3 && rest[2] === "edit" && rest[1]) {
      params.budgetId = rest[1];
      return { to: "/$workspaceId/budgets/$budgetId/edit", params };
    }
    if (rest.length === 2 && rest[1]) {
      params.budgetId = rest[1];
      return { to: "/$workspaceId/budgets/$budgetId", params };
    }
    return { to: "/$workspaceId/budgets", params };
  }

  const singleSegmentRoutes = [
    "transactions",
    "tags",
    "messages",
    "subscriptions",
  ] as const;

  if (
    rest.length === 1 &&
    singleSegmentRoutes.includes(
      rest[0] as (typeof singleSegmentRoutes)[number],
    )
  ) {
    return { to: `/$workspaceId/${rest[0]}`, params };
  }

  return { to: "/$workspaceId", params };
}
