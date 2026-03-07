import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "@/features/shared/api/client";
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

export async function getSubscriptions(
  query?: ISubscriptionsQuery,
): Promise<ISubscriptionsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<ISubscriptionsResponse>(`/subscriptions${queryString}`);
}

export async function getSubscription(
  subscriptionId: string,
): Promise<ISubscription> {
  return apiGet<ISubscription>(`/subscriptions/${subscriptionId}`);
}

export async function confirmSubscription(
  input: IConfirmSubscriptionInput,
): Promise<ISubscription> {
  return apiPost<ISubscription>("/subscriptions", input);
}

export async function updateSubscription(
  subscriptionId: string,
  input: IUpdateSubscriptionInput,
): Promise<ISubscription> {
  return apiPatch<ISubscription>(
    `/subscriptions/${subscriptionId}`,
    input,
  );
}

export async function deleteSubscription(
  subscriptionId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `/subscriptions/${subscriptionId}`,
  );
}

export async function detectSubscriptions(): Promise<IDetectSubscriptionsResponse> {
  return apiGet<IDetectSubscriptionsResponse>("/subscriptions/detect");
}

export async function dismissSubscriptionCandidate(
  input: IDismissSubscriptionCandidateInput,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    "/subscriptions/detect/dismiss",
    input,
  );
}

export async function getDismissals(): Promise<ISubscriptionDismissalsResponse> {
  return apiGet<ISubscriptionDismissalsResponse>(
    "/subscriptions/dismissals",
  );
}

export async function undismissCandidate(
  dismissalId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `/subscriptions/dismissals/${dismissalId}`,
  );
}
