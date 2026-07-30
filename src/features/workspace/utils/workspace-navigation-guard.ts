let userInitiatedWorkspaceNavigation = false;

export function markUserWorkspaceNavigation(): void {
  userInitiatedWorkspaceNavigation = true;
}

export function consumeUserWorkspaceNavigation(): boolean {
  const consumed = userInitiatedWorkspaceNavigation;
  userInitiatedWorkspaceNavigation = false;
  return consumed;
}
