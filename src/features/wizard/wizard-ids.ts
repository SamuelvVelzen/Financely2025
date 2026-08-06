/**
 * Canonical wizard ids. Workspace-scoped wizards encode the workspace id in the string.
 */

export const WIZARD_IDS = {
  ONBOARDING: "onboarding",
  /** Brief rename experiment — still treat as completed onboarding */
  FIRST_USER_LEGACY: "first-user",
  SPLIT_GROUP: "split-group",
} as const;

const WORKSPACE_SETUP_PREFIX = "workspace-setup:";

export function workspaceSetupWizardId(workspaceId: number): string {
  return `${WORKSPACE_SETUP_PREFIX}${workspaceId}`;
}

export function parseWorkspaceSetupWizardId(
  wizardId: string,
): number | null {
  if (!wizardId.startsWith(WORKSPACE_SETUP_PREFIX)) {
    return null;
  }
  const raw = wizardId.slice(WORKSPACE_SETUP_PREFIX.length);
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(n) || n < 1) {
    return null;
  }
  return n;
}

export function isWizardPathExemptFromOnboardingGate(pathname: string): boolean {
  return pathname.startsWith("/onboarding");
}
