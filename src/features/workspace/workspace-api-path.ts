import type { IWorkspaceId } from "@/features/workspace/workspace-id";

/**
 * Builds a path segment after `/api/v1` for workspace-scoped APIs, e.g.
 * `/${workspaceId}/transactions?page=1` (leading slash required by api client).
 */
export function workspaceApiV1Path(
  workspaceId: IWorkspaceId,
  resourcePath: string,
): string {
  const p = resourcePath.startsWith("/") ? resourcePath.slice(1) : resourcePath;
  return `/${workspaceId}/${p}`;
}
