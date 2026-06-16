import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/features/shared/api/client";
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
import type { IDefaultTagRulePreset } from "@/features/tag/config/default-tag-rules";
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export async function getTagRules(
  workspaceId: IWorkspaceId,
): Promise<ITagRulesResponse> {
  return apiGet<ITagRulesResponse>(
    workspaceApiV1Path(workspaceId, "tag-rules"),
  );
}

export async function createTagRule(
  workspaceId: IWorkspaceId,
  input: ICreateTagRuleInput,
): Promise<ITagRule> {
  return apiPost<ITagRule>(
    workspaceApiV1Path(workspaceId, "tag-rules"),
    input,
  );
}

export async function updateTagRule(
  workspaceId: IWorkspaceId,
  ruleId: string,
  input: IUpdateTagRuleInput,
): Promise<ITagRule> {
  return apiPatch<ITagRule>(
    workspaceApiV1Path(workspaceId, `tag-rules/${ruleId}`),
    input,
  );
}

export async function deleteTagRule(
  workspaceId: IWorkspaceId,
  ruleId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, `tag-rules/${ruleId}`),
  );
}

export async function matchTagRules(
  workspaceId: IWorkspaceId,
  input: ITagMatchRequest,
): Promise<ITagMatchResponse> {
  return apiPost<ITagMatchResponse>(
    workspaceApiV1Path(workspaceId, "tag-rules/match"),
    input,
  );
}

export async function discoverTagRulesFromHistory(
  workspaceId: IWorkspaceId,
): Promise<ITagHistoryDiscoveryResponse> {
  return apiGet<ITagHistoryDiscoveryResponse>(
    workspaceApiV1Path(workspaceId, "tag-rules/discover"),
  );
}

export async function enableTagRulePresets(
  workspaceId: IWorkspaceId,
  input: IEnableTagRulePresetsInput,
): Promise<ITagRulesResponse> {
  return apiPost<ITagRulesResponse>(
    workspaceApiV1Path(workspaceId, "tag-rules/enable-presets"),
    input,
  );
}

export async function getTagRulePresets(
  workspaceId: IWorkspaceId,
): Promise<{ data: IDefaultTagRulePreset[] }> {
  return apiGet<{ data: IDefaultTagRulePreset[] }>(
    workspaceApiV1Path(workspaceId, "tag-rules/presets"),
  );
}
