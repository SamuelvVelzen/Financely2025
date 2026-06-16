import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { ITag, ITagRule } from "@/features/shared/validation/schemas";
import { AddOrEditTagRuleDialog } from "@/features/tag-rule/components/add-or-edit-tag-rule-dialog";
import {
  useDeleteTagRule,
  useEnableTagRulePresets,
  useTagRulePresets,
  useTagRules,
  useUpdateTagRule,
} from "@/features/tag-rule/hooks/useTagRules";
import {
  getRecommendedTagMetadataForPreset,
  getRelatedPresetsForTag,
} from "@/features/tag/config/default-tag-rules";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Loading } from "@/features/ui/loading/loading";
import { useToast } from "@/features/ui/toast";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HiPencil, HiPlus, HiTrash, HiXMark } from "react-icons/hi2";

const SOURCE_LABELS: Record<ITagRule["source"], string> = {
  USER: "User",
  SYSTEM: "Preset",
  LEARNED: "History",
};

type ITagRulesForTagSectionProps = {
  tag: ITag;
  onClose?: () => void;
};

function sortEnabledFirst<T>(
  items: T[],
  isEnabled: (item: T) => boolean,
): T[] {
  return [...items].sort((a, b) => {
    const aRank = isEnabled(a) ? 0 : 1;
    const bRank = isEnabled(b) ? 0 : 1;
    return aRank - bRank;
  });
}

export function TagRulesForTagSection({
  tag,
  onClose,
}: ITagRulesForTagSectionProps) {
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);
  const { data, isLoading, error, refetch } = useTagRules();
  const { data: presetsData } = useTagRulePresets();
  const enablePresets = useEnableTagRulePresets();
  const updateRule = useUpdateTagRule();
  const deleteRule = useDeleteTagRule();
  const toast = useToast();

  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ITagRule | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ITagRule | undefined>();

  const rulesForTag = useMemo(
    () => data?.data.filter((rule) => rule.tagId === tag.id) ?? [],
    [data?.data, tag.id],
  );

  const isPresetEnabled = (presetLabel: string) =>
    rulesForTag.some(
      (rule) => rule.source === "SYSTEM" && rule.label === presetLabel,
    );

  const relatedPresets = useMemo(
    () =>
      getRelatedPresetsForTag(tag, rulesForTag, presetsData?.data ?? undefined),
    [tag, rulesForTag, presetsData?.data],
  );

  const sortedPresets = useMemo(
    () =>
      sortEnabledFirst(relatedPresets, (preset) =>
        isPresetEnabled(preset.label),
      ),
    [relatedPresets, rulesForTag],
  );

  const sortedRules = useMemo(
    () => sortEnabledFirst(rulesForTag, (rule) => rule.enabled),
    [rulesForTag],
  );

  const handleEnablePreset = async (presetId: string) => {
    try {
      const result = await enablePresets.mutateAsync({
        presetIds: [presetId],
        tagNameMap: { [presetId]: tag.name },
      });
      await refetch();
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success("Preset enabled");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to enable preset",
      );
    }
  };

  const handleToggleRule = async (rule: ITagRule) => {
    try {
      const result = await updateRule.mutateAsync({
        ruleId: rule.id,
        input: { enabled: !rule.enabled },
      });
      await refetch();
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success(rule.enabled ? "Rule disabled" : "Rule enabled");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update rule");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteRule.mutateAsync(deleteTarget.id);
      await refetch();
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success("Rule deleted");
      }
      setDeleteTarget(undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  return (
    <aside
      id="tag-rules-section"
      className="rounded-lg border border-border bg-surface/50 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text">Tagging rules</h3>
          <p className="text-xs text-text-muted mt-1">
            Suggest this tag from matching keywords.{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() =>
                navigate({
                  to: "/$workspaceId/smart-tagging",
                  params: { workspaceId: workspaceRouteParam },
                })
              }>
              All presets & history
            </button>
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="default"
            size="sm"
            clicked={() => {
              setSelectedRule(undefined);
              setIsRuleDialogOpen(true);
            }}>
            <HiPlus className="size-4" />
            Add
          </Button>
          {onClose && (
            <Button variant="default" size="sm" clicked={onClose} aria-label="Hide tagging rules">
              <HiXMark className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {sortedPresets.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Presets for this tag
          </h4>
          <ul className="space-y-2">
            {sortedPresets.map((preset) => {
              const isEnabled = isPresetEnabled(preset.label);
              const recommendedTag = getRecommendedTagMetadataForPreset(
                preset.tagName,
              );
              return (
                <li
                  key={preset.id}
                  className="p-3 rounded-lg border border-border bg-surface space-y-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {recommendedTag?.emoticon && (
                      <span className="text-base shrink-0">
                        {recommendedTag.emoticon}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text truncate">
                        {preset.label}
                      </p>
                      <p className="text-xs text-text-muted line-clamp-2">
                        {preset.keywords.slice(0, 4).join(", ")}
                        {preset.keywords.length > 4
                          ? ` +${preset.keywords.length - 4} more`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isEnabled ? "default" : "primary"}
                    size="sm"
                    className="w-full"
                    disabled={isEnabled || enablePresets.isPending}
                    clicked={() => handleEnablePreset(preset.id)}>
                    {isEnabled ? "Enabled" : "Enable preset"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Your rules
        </h4>

        {isLoading ? (
          <Loading text="Loading rules" />
        ) : error ? (
          <p className="text-sm text-danger">{error.message}</p>
        ) : sortedRules.length === 0 ? (
          <p className="text-sm text-text-muted py-2">
            No custom rules yet.
            {sortedPresets.length === 0
              ? " Add keywords or enable a preset above."
              : " Add your own keywords below."}
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedRules.map((rule) => (
              <li
                key={rule.id}
                className="p-3 rounded-lg border border-border bg-surface space-y-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-text truncate">
                      {rule.label || "Untitled rule"}
                    </span>
                    <Badge variant="default">{SOURCE_LABELS[rule.source]}</Badge>
                    {!rule.enabled && (
                      <Badge variant="warning">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {rule.keywords.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    clicked={() => handleToggleRule(rule)}>
                    {rule.enabled ? "Off" : "On"}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    clicked={() => {
                      setSelectedRule(rule);
                      setIsRuleDialogOpen(true);
                    }}>
                    <HiPencil className="size-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    clicked={() => setDeleteTarget(rule)}>
                    <HiTrash className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddOrEditTagRuleDialog
        open={isRuleDialogOpen}
        onOpenChange={setIsRuleDialogOpen}
        rule={selectedRule}
        lockTagId={tag.id}
        transactionType={tag.transactionType}
        onSuccess={() => void refetch()}
      />

      <DeleteDialog
        title="Delete tag rule"
        content={`Delete rule "${deleteTarget?.label || deleteTarget?.keywords.join(", ")}"?`}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setDeleteTarget(undefined),
          },
          {
            buttonContent: "Delete",
            clicked: handleDeleteConfirm,
            variant: "danger",
          },
        ]}
      />
    </aside>
  );
}
