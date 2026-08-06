const STORAGE_KEY = "financely:pending-workspace-setup";

export type IPendingWorkspaceSetup = {
  id: number;
  name: string;
};

export function setPendingWorkspaceSetup(
  workspace: IPendingWorkspaceSetup,
): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    // Ignore quota / private mode failures
  }
}

export function consumePendingWorkspaceSetup(): IPendingWorkspaceSetup | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed != null &&
      "id" in parsed &&
      "name" in parsed &&
      typeof (parsed as { id: unknown }).id === "number" &&
      typeof (parsed as { name: unknown }).name === "string"
    ) {
      return parsed as IPendingWorkspaceSetup;
    }
    return null;
  } catch {
    return null;
  }
}
