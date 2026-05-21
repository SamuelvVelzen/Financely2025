/**
 * Workspace id in URLs and APIs is a positive integer (Prisma Int PK).
 * Route params arrive as strings; normalize here.
 */
export type IWorkspaceId = number;

export function parseWorkspaceIdParam(
  raw: string | undefined | null,
): IWorkspaceId | null {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(n) || n < 1) {
    return null;
  }
  return n;
}

export function workspaceIdToUrlSegment(id: IWorkspaceId): string {
  return String(id);
}

/**
 * TanStack Router route params use string `workspaceId`; use when building
 * `params` for `Link` / `navigate` / `NavItem`.
 */
export function workspaceIdToRouteParam(
  id: IWorkspaceId | null | undefined,
): string {
  return id != null ? workspaceIdToUrlSegment(id) : "";
}
