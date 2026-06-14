const HOME_REDIRECT_KEY = "financely.homeRedirectDone";

let userInitiatedWorkspaceNavigation = false;

export function markUserWorkspaceNavigation(): void {
  userInitiatedWorkspaceNavigation = true;
}

export function consumeUserWorkspaceNavigation(): boolean {
  const consumed = userInitiatedWorkspaceNavigation;
  userInitiatedWorkspaceNavigation = false;
  return consumed;
}

export function markHomeRedirectStarted(): boolean {
  if (typeof sessionStorage === "undefined") {
    return true;
  }
  if (sessionStorage.getItem(HOME_REDIRECT_KEY)) {
    return false;
  }
  sessionStorage.setItem(HOME_REDIRECT_KEY, "1");
  return true;
}
