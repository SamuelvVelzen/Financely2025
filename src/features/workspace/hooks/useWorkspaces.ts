import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { useFinMutation } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { IWorkspaceSummary } from "@/features/shared/validation/schemas";
import {
  createWorkspace,
  deleteWorkspace,
  renameWorkspace,
} from "@/features/users/api/client";

export function useCreateWorkspace() {
  return useFinMutation<IWorkspaceSummary, Error, { name: string }>({
    mutationFn: ({ name }) => createWorkspace(name),
    invalidateQueries: [() => queryKeys.me()],
    getOfflineQueuedToast: (input) => ({
      title: `Workspace "${input.name}" created successfully`,
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useRenameWorkspace() {
  return useFinMutation<
    IWorkspaceSummary,
    Error,
    { workspaceId: number; name: string }
  >({
    mutationFn: ({ workspaceId, name }) => renameWorkspace(workspaceId, name),
    invalidateQueries: [() => queryKeys.me()],
    getOfflineQueuedToast: (input) => ({
      title: `Workspace "${input.name}" updated successfully`,
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDeleteWorkspace() {
  return useFinMutation<{ success: boolean }, Error, number>({
    mutationFn: (workspaceId) => deleteWorkspace(workspaceId),
    invalidateQueries: [() => queryKeys.me()],
    getOfflineQueuedToast: () => ({
      title: "Workspace deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
