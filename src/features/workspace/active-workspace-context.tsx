import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

const ActiveWorkspaceIdContext = createContext<IWorkspaceId | null>(null);

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

export function useActiveWorkspaceId(): IWorkspaceId {
  const id = useContext(ActiveWorkspaceIdContext);
  if (id === null) {
    throw new Error(
      "useActiveWorkspaceId must be used within a /:workspaceId route layout",
    );
  }
  return id;
}
