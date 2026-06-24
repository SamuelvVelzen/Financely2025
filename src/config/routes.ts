import type { IWorkspaceId } from "@/features/workspace/workspace-id";

/**
 * App paths that are not workspace-scoped (still under (app) layout).
 */
export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ACCOUNT: "/account",
  ONBOARDING: "/onboarding",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

export { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";

/**
 * Build an in-app path under a workspace, e.g. `workspacePath(id, "transactions")` → `/{id}/transactions`.
 */
export function workspacePath(workspaceId: IWorkspaceId, segment = ""): string {
  const base = `/${workspaceId}`;
  const s = segment.startsWith("/") ? segment.slice(1) : segment;
  return s ? `${base}/${s}` : base;
}
