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

export function useSubscriptions(query?: ISubscriptionsQuery) {
  return useFinQuery<ISubscriptionsResponse, Error>({
    queryKey: queryKeys.subscriptions(query),
    queryFn: () => getSubscriptions(query),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubscription(subscriptionId: string) {
  return useFinQuery<ISubscription, Error>({
    queryKey: queryKeys.subscription(subscriptionId),
    queryFn: () => getSubscription(subscriptionId),
    staleTime: 2 * 60 * 1000,
    ...(subscriptionId ? {} : { enabled: false }),
  });
}

export function useDetectSubscriptions() {
  return useFinQuery<IDetectSubscriptionsResponse, Error>({
    queryKey: queryKeys.subscriptionCandidates(),
    queryFn: () => detectSubscriptions(),
    staleTime: 30 * 1000,
    enabled: false,
  });
}

export function useConfirmSubscription() {
  return useFinMutation<ISubscription, Error, IConfirmSubscriptionInput>({
    mutationFn: confirmSubscription,
    invalidateQueries: [
      () => queryKeys.subscriptions(),
      () => queryKeys.subscriptionCandidates(),
      () => queryKeys.transactions(),
    ],
    getOfflineQueuedToast: () => ({
      title: "Subscription confirmed",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDismissCandidate() {
  return useFinMutation<
    { success: boolean },
    Error,
    IDismissSubscriptionCandidateInput
  >({
    mutationFn: dismissSubscriptionCandidate,
    invalidateQueries: [
      () => queryKeys.subscriptionCandidates(),
      () => queryKeys.subscriptionDismissals(),
    ],
    getOfflineQueuedToast: () => ({
      title: "Candidate dismissed",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useSubscriptionDismissals() {
  return useFinQuery<ISubscriptionDismissalsResponse, Error>({
    queryKey: queryKeys.subscriptionDismissals(),
    queryFn: () => getDismissals(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUndismissCandidate() {
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: undismissCandidate,
    invalidateQueries: [
      () => queryKeys.subscriptionDismissals(),
      () => queryKeys.subscriptionCandidates(),
    ],
    getOfflineQueuedToast: () => ({
      title: "Candidate can be detected again",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useFinMutation<
    ISubscription,
    Error,
    { subscriptionId: string; input: IUpdateSubscriptionInput }
  >({
    mutationFn: ({ subscriptionId, input }) =>
      updateSubscription(subscriptionId, input),
    invalidateQueries: [() => queryKeys.subscriptions()],
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription(variables.subscriptionId),
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
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteSubscription,
    invalidateQueries: [
      () => queryKeys.subscriptions(),
      () => queryKeys.transactions(),
    ],
    getOfflineQueuedToast: () => ({
      title: "Subscription deleted",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
