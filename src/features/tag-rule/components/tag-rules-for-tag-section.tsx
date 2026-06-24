import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type {
  ICreateTagRuleWithTagInput,
  ITag,
  ITagRule,
} from "@/features/shared/validation/schemas";
import { AddOrEditTagRuleDialog } from "@/features/tag-rule/components/add-or-edit-tag-rule-dialog";
import {
  useDeleteTagRule,
  useEnableTagRulePresets,
  useTagRulePresets,
  useTagRules,
  useUpdateTagRule,
} from "@/features/tag-rule/hooks/useTagRules";
import type { IPendingTagRule } from "@/features/tag-rule/types/pending-tag-rule";
import {
  getRecommendedTagMetadataForPreset,
  getRelatedPresetsForTag,
} from "@/features/tag/config/default-tag-rules";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { LinkButton } from "@/features/ui/button/link-button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Loading } from "@/features/ui/loading/loading";
import { useToast } from "@/features/ui/toast";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { HiOutlineExternalLink } from "react-icons/hi";
import { HiPencil, HiPlus, HiTrash } from "react-icons/hi2";

const SOURCE_LABELS: Record<ITagRule["source"], string> = {
  USER: "User",
  SYSTEM: "Preset",
  LEARNED: "History",
};

type ITagRulesForTagSectionProps = {
  tag?: ITag;
  tagPreview?: Pick<ITag, "name" | "transactionType">;
  pendingRules?: IPendingTagRule[];
  onPendingRulesChange?: (rules: IPendingTagRule[]) => void;
  ensureTag?: () => Promise<ITag>;
  onTagEnsured?: (tag: ITag) => void;

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
  tagPreview,
  pendingRules = [],
  onPendingRulesChange,
  ensureTag,
  onTagEnsured,
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
  const [selectedPendingRule, setSelectedPendingRule] = useState<
    IPendingTagRule | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<ITagRule | undefined>();
  const [deletePendingTarget, setDeletePendingTarget] = useState<
    IPendingTagRule | undefined
  >();
  const [ruleDialogTagId, setRuleDialogTagId] = useState<string | undefined>();

  const isPendingMode = !tag && !!onPendingRulesChange;
  const presetTag = tag ?? tagPreview;

  const rulesForTag = useMemo(
    () =>
      tag ? data?.data.filter((rule) => rule.tagId === tag.id) ?? [] : [],
    [data?.data, tag],
  );

  const isPresetEnabled = useCallback(
    (presetLabel: string) =>
      rulesForTag.some(
        (rule) => rule.source === "SYSTEM" && rule.label === presetLabel,
      ),
    [rulesForTag],
  );

  const relatedPresets = useMemo(
    () =>
      presetTag?.name
        ? getRelatedPresetsForTag(
          presetTag,
          rulesForTag,
          presetsData?.data ?? undefined,
        )
        : [],
    [presetTag, rulesForTag, presetsData?.data],
  );

  const sortedPresets = useMemo(
    () =>
      sortEnabledFirst(relatedPresets, (preset) =>
        isPresetEnabled(preset.label),
      ),
    [relatedPresets, isPresetEnabled],
  );

  const sortedRules = useMemo(
    () => sortEnabledFirst(rulesForTag, (rule) => rule.enabled),
    [rulesForTag],
  );

  const sortedPendingRules = useMemo(
    () => sortEnabledFirst(pendingRules, (rule) => rule.enabled),
    [pendingRules],
  );

  const handlePendingRuleSubmit = (
    rule: ICreateTagRuleWithTagInput,
    clientId?: string,
  ) => {
    if (!onPendingRulesChange) {
      return;
    }

    const nextRule: IPendingTagRule = {
      ...rule,
      clientId: clientId ?? crypto.randomUUID(),
    };
    const existingIndex = pendingRules.findIndex(
      (item) => item.clientId === nextRule.clientId,
    );

    if (existingIndex >= 0) {
      const nextRules = [...pendingRules];
      nextRules[existingIndex] = nextRule;
      onPendingRulesChange(nextRules);
      return;
    }

    onPendingRulesChange([...pendingRules, nextRule]);
  };

  const resolveTag = async (): Promise<ITag | null> => {
    if (tag) {
      return tag;
    }

    if (!ensureTag) {
      return null;
    }

    try {
      const ensuredTag = await ensureTag();
      onTagEnsured?.(ensuredTag);
      return ensuredTag;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Save the tag before adding rules",
      );
      return null;
    }
  };

  const handleEnablePreset = async (presetId: string) => {
    const resolvedTag = await resolveTag();
    if (!resolvedTag) {
      return;
    }

    try {
      const result = await enablePresets.mutateAsync({
        presetIds: [presetId],
        tagNameMap: { [presetId]: resolvedTag.name },
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

      <div className="flex justify-between">
        <h3 className="text-sm font-semibold text-text">Tagging rules</h3>
        <Button
          variant="default"
          size="sm"
          clicked={() => {
            if (isPendingMode) {
              setSelectedPendingRule(undefined);
              setSelectedRule(undefined);
              setIsRuleDialogOpen(true);
              return;
            }

            void (async () => {
              const resolvedTag = await resolveTag();
              if (!resolvedTag) {
                return;
              }

              setRuleDialogTagId(resolvedTag.id);
              setSelectedRule(undefined);
              setSelectedPendingRule(undefined);
              setIsRuleDialogOpen(true);
            })();
          }}>
          <HiPlus className="size-4" />
          Add
        </Button>
      </div>

      <p className="text-xs text-text-muted mt-1 flex gap-1">
        Suggest this tag from matching keywords.{" "}

        <LinkButton variant="default" size="xs" clicked={() =>
          navigate({
            to: "/$workspaceId/tags/smart-tagging",
            params: { workspaceId: workspaceRouteParam },
          })
        }>
          All presets & history <HiOutlineExternalLink className="size-4" />
        </LinkButton>
      </p>


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

        {isPendingMode ? (
          sortedPendingRules.length === 0 ? (
            <p className="text-sm text-text-muted py-2">
              No custom rules yet.
              {sortedPresets.length === 0
                ? " Add keywords or enable a preset above."
                : " Add your own keywords below."}
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedPendingRules.map((rule) => (
                <li
                  key={rule.clientId}
                  className="p-3 rounded-lg border border-border bg-surface space-y-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium text-text truncate">
                        {rule.label || "Untitled rule"}
                      </span>
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
                      clicked={() => {
                        onPendingRulesChange?.(
                          pendingRules.map((item) =>
                            item.clientId === rule.clientId
                              ? { ...item, enabled: !item.enabled }
                              : item,
                          ),
                        );
                      }}>
                      {rule.enabled ? "Off" : "On"}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      clicked={() => {
                        setSelectedPendingRule(rule);
                        setSelectedRule(undefined);
                        setIsRuleDialogOpen(true);
                      }}>
                      <HiPencil className="size-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      clicked={() => setDeletePendingTarget(rule)}>
                      <HiTrash className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : isLoading ? (
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
        pendingRule={selectedPendingRule}
        lockTagId={isPendingMode ? undefined : ruleDialogTagId ?? tag?.id}
        transactionType={tag?.transactionType ?? tagPreview?.transactionType}
        onPendingRuleSubmit={isPendingMode ? handlePendingRuleSubmit : undefined}
        onSuccess={() => {
          setSelectedPendingRule(undefined);
          void refetch();
        }}
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

      <DeleteDialog
        title="Delete tag rule"
        content={`Delete rule "${deletePendingTarget?.label || deletePendingTarget?.keywords.join(", ")}"?`}
        open={!!deletePendingTarget}
        onOpenChange={(open) => {
          if (!open) setDeletePendingTarget(undefined);
        }}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setDeletePendingTarget(undefined),
          },
          {
            buttonContent: "Delete",
            clicked: () => {
              if (!deletePendingTarget || !onPendingRulesChange) {
                return;
              }

              onPendingRulesChange(
                pendingRules.filter(
                  (rule) => rule.clientId !== deletePendingTarget.clientId,
                ),
              );
              setDeletePendingTarget(undefined);
            },
            variant: "danger",
          },
        ]}
      />
    </aside>
  );
}
