import {
  WorkspaceSetupDialog,
  type IWorkspaceSetupDialogTarget,
} from "@/features/workspace/components/workspace-setup-dialog";
import { consumePendingWorkspaceSetup } from "@/features/workspace/utils/pending-workspace-setup";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Opens the workspace setup dialog after create (queued via sessionStorage).
 */
export function WorkspaceSetupDialogHost() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [workspace, setWorkspace] = useState<IWorkspaceSetupDialogTarget | null>(
    null,
  );

  useEffect(() => {
    const pending = consumePendingWorkspaceSetup();
    if (pending) {
      setWorkspace(pending);
    }
  }, [pathname]);

  return (
    <WorkspaceSetupDialog
      open={workspace != null}
      onOpenChange={(open) => {
        if (!open) {
          setWorkspace(null);
        }
      }}
      workspace={workspace}
    />
  );
}
