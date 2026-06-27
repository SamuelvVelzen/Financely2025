import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import {
  buildOptimisticWorkspace,
  optimisticMeWorkspaceHandlers,
} from "@/features/shared/offline/optimistic-cache";
import type { IUserResponse } from "@/features/shared/validation/schemas";
import { useFinMutation } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { IWorkspaceSummary } from "@/features/shared/validation/schemas";
import {
  createWorkspace,
  deleteWorkspace,
  renameWorkspace,
} from "@/features/users/api/client";
import { useQueryClient } from "@tanstack/react-query";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useFinMutation<IWorkspaceSummary, Error, { name: string }>({
    mutationFn: ({ name }) => createWorkspace(name),
    invalidateQueries: [() => queryKeys.me()],
    onMutate: async ({ name }) => {
      const key = queryKeys.me();
      const snapshot = queryClient.getQueryData<IUserResponse>(key);
      optimisticMeWorkspaceHandlers(queryClient, (me) => ({
        ...me,
        workspaces: [...me.workspaces, buildOptimisticWorkspace(name)],
      }));
      return { snapshot: [[key, snapshot]] as const };
    },
    getOfflineQueuedToast: (input) => ({
      title: `Workspace "${input.name}" created successfully`,
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useRenameWorkspace() {
  const queryClient = useQueryClient();
  return useFinMutation<
    IWorkspaceSummary,
    Error,
    { workspaceId: number; name: string }
  >({
    mutationFn: ({ workspaceId, name }) => renameWorkspace(workspaceId, name),
    invalidateQueries: [() => queryKeys.me()],
    onMutate: async ({ workspaceId, name }) => {
      const key = queryKeys.me();
      const snapshot = queryClient.getQueryData<IUserResponse>(key);
      optimisticMeWorkspaceHandlers(queryClient, (me) => ({
        ...me,
        workspaces: me.workspaces.map((ws) =>
          ws.id === workspaceId ? { ...ws, name, updatedAt: new Date().toISOString() } : ws,
        ),
      }));
      return { snapshot: [[key, snapshot]] as const };
    },
    getOfflineQueuedToast: (input) => ({
      title: `Workspace "${input.name}" updated successfully`,
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useFinMutation<{ success: boolean }, Error, number>({
    mutationFn: (workspaceId) => deleteWorkspace(workspaceId),
    invalidateQueries: [() => queryKeys.me()],
    onMutate: async (workspaceId) => {
      const key = queryKeys.me();
      const snapshot = queryClient.getQueryData<IUserResponse>(key);
      optimisticMeWorkspaceHandlers(queryClient, (me) => ({
        ...me,
        workspaces: me.workspaces.filter((ws) => ws.id !== workspaceId),
      }));
      return { snapshot: [[key, snapshot]] as const };
    },
    getOfflineQueuedToast: () => ({
      title: "Workspace deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
