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
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export async function getSubscriptions(
  workspaceId: IWorkspaceId,
  query?: ISubscriptionsQuery,
): Promise<ISubscriptionsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<ISubscriptionsResponse>(
    `${workspaceApiV1Path(workspaceId, "subscriptions")}${queryString}`,
  );
}

export async function getSubscription(
  workspaceId: IWorkspaceId,
  subscriptionId: string,
): Promise<ISubscription> {
  return apiGet<ISubscription>(
    workspaceApiV1Path(workspaceId, `subscriptions/${subscriptionId}`),
  );
}

export async function confirmSubscription(
  workspaceId: IWorkspaceId,
  input: IConfirmSubscriptionInput,
): Promise<ISubscription> {
  return apiPost<ISubscription>(
    workspaceApiV1Path(workspaceId, "subscriptions"),
    input,
  );
}

export async function updateSubscription(
  workspaceId: IWorkspaceId,
  subscriptionId: string,
  input: IUpdateSubscriptionInput,
): Promise<ISubscription> {
  return apiPatch<ISubscription>(
    workspaceApiV1Path(workspaceId, `subscriptions/${subscriptionId}`),
    input,
  );
}

export async function deleteSubscription(
  workspaceId: IWorkspaceId,
  subscriptionId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, `subscriptions/${subscriptionId}`),
  );
}

export async function detectSubscriptions(
  workspaceId: IWorkspaceId,
): Promise<IDetectSubscriptionsResponse> {
  return apiGet<IDetectSubscriptionsResponse>(
    workspaceApiV1Path(workspaceId, "subscriptions/detect"),
  );
}

export async function dismissSubscriptionCandidate(
  workspaceId: IWorkspaceId,
  input: IDismissSubscriptionCandidateInput,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, "subscriptions/detect/dismiss"),
    input,
  );
}

export async function getDismissals(
  workspaceId: IWorkspaceId,
): Promise<ISubscriptionDismissalsResponse> {
  return apiGet<ISubscriptionDismissalsResponse>(
    workspaceApiV1Path(workspaceId, "subscriptions/dismissals"),
  );
}

export async function undismissCandidate(
  workspaceId: IWorkspaceId,
  dismissalId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    workspaceApiV1Path(
      workspaceId,
      `subscriptions/dismissals/${dismissalId}`,
    ),
  );
}
