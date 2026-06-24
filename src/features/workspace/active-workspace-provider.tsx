import type { ReactNode } from "react";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { ActiveWorkspaceIdContext } from "./active-workspace-context";

export function ActiveWorkspaceProvider({
  workspaceId,
  children,
}: {
  workspaceId: IWorkspaceId;
  children: ReactNode;
}) {
  return (
    <ActiveWorkspaceIdContext.Provider value={workspaceId}>
      {children}
    </ActiveWorkspaceIdContext.Provider>
  );
}
