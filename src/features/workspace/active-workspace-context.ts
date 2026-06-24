import { createContext, useContext } from "react";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export const ActiveWorkspaceIdContext = createContext<IWorkspaceId | null>(
  null,
);

export function useActiveWorkspaceId(): IWorkspaceId {
  const id = useContext(ActiveWorkspaceIdContext);
  if (id === null) {
    throw new Error(
      "useActiveWorkspaceId must be used within a /:workspaceId route layout",
    );
  }
  return id;
}
