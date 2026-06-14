import {
  parseWorkspaceIdParam,
  type IWorkspaceId,
} from "@/features/workspace/workspace-id";

/**
 * Resolves workspace id for nav/API outside explicit route context.
 * URL segment is used only when it matches an owned workspace.
 */
export function resolveNavWorkspaceId(
  pathname: string,
  workspaces: ReadonlyArray<{ id: IWorkspaceId }>,
  storedRaw: string | null,
): IWorkspaceId | null {
  if (workspaces.length === 0) {
    return null;
  }

  const workspaceIds = new Set(workspaces.map((w) => w.id));

  const firstSeg = pathname.split("/").filter(Boolean)[0] ?? "";
  const fromUrl = parseWorkspaceIdParam(firstSeg);
  if (fromUrl !== null && workspaceIds.has(fromUrl)) {
    return fromUrl;
  }

  const fromStorage = parseWorkspaceIdParam(storedRaw);
  if (fromStorage !== null && workspaceIds.has(fromStorage)) {
    return fromStorage;
  }

  return workspaces[0]!.id;
}
