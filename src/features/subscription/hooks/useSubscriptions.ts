import {
  confirmSubscription,
  deleteSubscription,
  detectSubscriptions,
  dismissSubscriptionCandidate,
  getDismissals,
  getSubscription,
  getSubscriptions,
  undismissCandidate,
  updateSubscription,
} from "@/features/subscription/api/client";
import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import type {
  IConfirmSubscriptionInput,
  IDetectSubscriptionsResponse,
  IDismissSubscriptionCandidateInput,
  ISubscription,
  ISubscriptionDismissalsResponse,
  ISubscriptionsQuery,
  ISubscriptionsResponse,
  IUpdateSubscriptionInput,
} from "@/features/shared/validation/schemas";
import { useQueryClient } from "@tanstack/react-query";

function requireWorkspaceId(id: number | null): number {
  if (id == null) {
    throw new Error("Workspace is required");
  }
  return id;
}

export function useSubscriptions(query?: ISubscriptionsQuery) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<ISubscriptionsResponse, Error>({
    queryKey: enabled
      ? queryKeys.subscriptions(workspaceId, query)
      : (["subscriptions", "disabled"] as const),
    queryFn: () =>
      getSubscriptions(requireWorkspaceId(workspaceId), query),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

export function useSubscription(subscriptionId: string) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null && Boolean(subscriptionId);
  return useFinQuery<ISubscription, Error>({
    queryKey: enabled
      ? queryKeys.subscription(workspaceId, subscriptionId)
      : (["subscription", "disabled"] as const),
    queryFn: () =>
      getSubscription(
        requireWorkspaceId(workspaceId),
        subscriptionId,
      ),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

export function useDetectSubscriptions() {
  const workspaceId = useNavWorkspaceId();
  const hasWorkspace = workspaceId != null;
  return useFinQuery<IDetectSubscriptionsResponse, Error>({
    queryKey: hasWorkspace
      ? queryKeys.subscriptionCandidates(workspaceId)
      : (["subscription-candidates", "disabled"] as const),
    queryFn: () =>
      detectSubscriptions(requireWorkspaceId(workspaceId)),
    staleTime: 30 * 1000,
    enabled: false,
  });
}

export function useConfirmSubscription() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ISubscription, Error, IConfirmSubscriptionInput>({
    mutationFn: (input) =>
      confirmSubscription(requireWorkspaceId(workspaceId), input),
    invalidateQueries: [
      () => queryKeys.subscriptions(workspaceId!),
      () => queryKeys.subscriptionCandidates(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Subscription confirmed",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDismissCandidate() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<
    { success: boolean },
    Error,
    IDismissSubscriptionCandidateInput
  >({
    mutationFn: (input) =>
      dismissSubscriptionCandidate(requireWorkspaceId(workspaceId), input),
    invalidateQueries: [
      () => queryKeys.subscriptionCandidates(workspaceId!),
      () => queryKeys.subscriptionDismissals(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Candidate dismissed",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useSubscriptionDismissals() {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<ISubscriptionDismissalsResponse, Error>({
    queryKey: enabled
      ? queryKeys.subscriptionDismissals(workspaceId)
      : (["subscription-dismissals", "disabled"] as const),
    queryFn: () =>
      getDismissals(requireWorkspaceId(workspaceId)),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

export function useUndismissCandidate() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (dismissalId) =>
      undismissCandidate(requireWorkspaceId(workspaceId), dismissalId),
    invalidateQueries: [
      () => queryKeys.subscriptionDismissals(workspaceId!),
      () => queryKeys.subscriptionCandidates(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Candidate can be detected again",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useUpdateSubscription() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();

  return useFinMutation<
    ISubscription,
    Error,
    { subscriptionId: string; input: IUpdateSubscriptionInput }
  >({
    mutationFn: ({ subscriptionId, input }) =>
      updateSubscription(
        requireWorkspaceId(workspaceId),
        subscriptionId,
        input,
      ),
    invalidateQueries: [() => queryKeys.subscriptions(workspaceId!)],
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription(
          workspaceId!,
          variables.subscriptionId,
        ),
      });
    },
    getOfflineQueuedToast: (vars) => ({
      title: vars.input.active
        ? "Subscription resumed"
        : "Subscription paused",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDeleteSubscription() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (subscriptionId) =>
      deleteSubscription(requireWorkspaceId(workspaceId), subscriptionId),
    invalidateQueries: [
      () => queryKeys.subscriptions(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Subscription deleted",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
