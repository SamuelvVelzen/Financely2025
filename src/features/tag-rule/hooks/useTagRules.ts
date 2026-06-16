import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICreateTagRuleInput,
  IEnableTagRulePresetsInput,
  ITagHistoryDiscoveryResponse,
  ITagMatchRequest,
  ITagMatchResponse,
  ITagRule,
  ITagRulesResponse,
  IUpdateTagRuleInput,
} from "@/features/shared/validation/schemas";
import {
  createTagRule,
  deleteTagRule,
  discoverTagRulesFromHistory,
  enableTagRulePresets,
  getTagRulePresets,
  getTagRules,
  matchTagRules,
  updateTagRule,
} from "@/features/tag-rule/api/client";
import type { IDefaultTagRulePreset } from "@/features/tag/config/default-tag-rules";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";

function requireWorkspaceId(id: number | null): number {
  if (id == null) {
    throw new Error("Workspace is required");
  }
  return id;
}

export function useTagRules() {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<ITagRulesResponse, Error>({
    queryKey: enabled
      ? queryKeys.tagRules(workspaceId)
      : (["tag-rules", "disabled"] as const),
    queryFn: () => getTagRules(requireWorkspaceId(workspaceId)),
    staleTime: 1 * 60 * 1000,
    enabled,
  });
}

export function useTagRulePresets() {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<{ data: IDefaultTagRulePreset[] }, Error>({
    queryKey: enabled
      ? queryKeys.tagRulePresets(workspaceId)
      : (["tag-rules", "presets", "disabled"] as const),
    queryFn: () => getTagRulePresets(requireWorkspaceId(workspaceId)),
    staleTime: 24 * 60 * 60 * 1000,
    enabled,
  });
}

export function useTagRuleDiscoveries() {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<ITagHistoryDiscoveryResponse, Error>({
    queryKey: enabled
      ? queryKeys.tagRuleDiscoveries(workspaceId)
      : (["tag-rules", "discover", "disabled"] as const),
    queryFn: () => discoverTagRulesFromHistory(requireWorkspaceId(workspaceId)),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useCreateTagRule() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITagRule, Error, ICreateTagRuleInput>({
    mutationFn: (input) =>
      createTagRule(requireWorkspaceId(workspaceId), input),
    invalidateQueries: [
      () => queryKeys.tagRules(workspaceId!),
      () => queryKeys.tagRuleDiscoveries(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Tag rule created successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useUpdateTagRule() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<
    ITagRule,
    Error,
    { ruleId: string; input: IUpdateTagRuleInput }
  >({
    mutationFn: ({ ruleId, input }) =>
      updateTagRule(requireWorkspaceId(workspaceId), ruleId, input),
    invalidateQueries: [() => queryKeys.tagRules(workspaceId!)],
    getOfflineQueuedToast: () => ({
      title: "Tag rule updated successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDeleteTagRule() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (ruleId) =>
      deleteTagRule(requireWorkspaceId(workspaceId), ruleId),
    invalidateQueries: [() => queryKeys.tagRules(workspaceId!)],
    getOfflineQueuedToast: () => ({
      title: "Tag rule deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useEnableTagRulePresets() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITagRulesResponse, Error, IEnableTagRulePresetsInput>({
    mutationFn: (input) =>
      enableTagRulePresets(requireWorkspaceId(workspaceId), input),
    invalidateQueries: [
      () => queryKeys.tagRules(workspaceId!),
      () => queryKeys.tags(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Tag rule presets enabled",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useMatchTagRules() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITagMatchResponse, Error, ITagMatchRequest>({
    mutationFn: (input) =>
      matchTagRules(requireWorkspaceId(workspaceId), input),
  });
}
