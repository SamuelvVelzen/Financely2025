import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { ITagHistoryDiscovery, ITagRule } from "@/features/shared/validation/schemas";
import { AddOrEditTagRuleDialog } from "@/features/tag-rule/components/add-or-edit-tag-rule-dialog";
import {
  useCreateTagRule,
  useDeleteTagRule,
  useEnableTagRulePresets,
  useTagRuleDiscoveries,
  useTagRulePresets,
  useTagRules,
  useUpdateTagRule,
} from "@/features/tag-rule/hooks/useTagRules";
import { getRecommendedTagMetadataForPreset } from "@/features/tag/config/default-tag-rules";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { SearchInput } from "@/features/ui/input/search-input";
import { Loading } from "@/features/ui/loading/loading";
import { useToast } from "@/features/ui/toast";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useMemo, useState } from "react";
import { HiOutlineQueueList, HiPlus, HiTrash } from "react-icons/hi2";

const SOURCE_LABELS: Record<ITagRule["source"], string> = {
  USER: "User",
  SYSTEM: "System",
  LEARNED: "Learned",
};

function matchesSearch(
  query: string,
  ...parts: (string | null | undefined)[]
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return parts.some((part) =>
    part?.toLowerCase().includes(normalizedQuery),
  );
}

export function TagRulesPanel() {
  const { data: rulesData, isLoading, error, refetch } = useTagRules();
  const { data: presetsData } = useTagRulePresets();
  const { data: discoveriesData } = useTagRuleDiscoveries();
  const enablePresets = useEnableTagRulePresets();
  const updateRule = useUpdateTagRule();
  const deleteRule = useDeleteTagRule();
  const createRule = useCreateTagRule();
  const toast = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ITagRule | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ITagRule | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const rules = useMemo(() => rulesData?.data ?? [], [rulesData?.data]);
  const presets = useMemo(() => presetsData?.data ?? [], [presetsData?.data]);
  const discoveries = useMemo(
    () => discoveriesData?.data ?? [],
    [discoveriesData?.data],
  );

  const enabledPresetIds = useMemo(() => {
    const systemLabels = new Set(
      rules.filter((rule) => rule.source === "SYSTEM").map((rule) => rule.label),
    );
    return presets
      .filter((preset) => systemLabels.has(preset.label))
      .map((preset) => preset.id);
  }, [presets, rules]);

  const filteredRules = useMemo(
    () =>
      rules.filter((rule) =>
        matchesSearch(
          debouncedSearchQuery,
          rule.label,
          rule.tag?.name,
          rule.keywords.join(" "),
        ),
      ),
    [rules, debouncedSearchQuery],
  );

  const filteredPresets = useMemo(() => {
    const matching = presets.filter((preset) =>
      matchesSearch(
        debouncedSearchQuery,
        preset.label,
        preset.tagName,
        preset.keywords.join(" "),
      ),
    );

    return [...matching].sort((a, b) => {
      const aEnabled = enabledPresetIds.includes(a.id) ? 1 : 0;
      const bEnabled = enabledPresetIds.includes(b.id) ? 1 : 0;
      return aEnabled - bEnabled;
    });
  }, [presets, debouncedSearchQuery, enabledPresetIds]);

  const filteredDiscoveries = useMemo(
    () =>
      discoveries.filter((discovery) =>
        matchesSearch(
          debouncedSearchQuery,
          discovery.keyword,
          discovery.tagName,
        ),
      ),
    [discoveries, debouncedSearchQuery],
  );

  const hasSearchFilter = debouncedSearchQuery.trim().length > 0;

  const handleEnablePreset = async (presetId: string) => {
    try {
      const result = await enablePresets.mutateAsync({ presetIds: [presetId] });
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
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success("Rule deleted");
      }
      setDeleteTarget(undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  const handlePromoteDiscovery = async (discovery: ITagHistoryDiscovery) => {
    try {
      const result = await createRule.mutateAsync({
        tagId: discovery.tagId,
        label: discovery.keyword,
        keywords: [discovery.keyword],
        matchField: "NAME",
        applyAs: "PRIMARY",
        priority: 5,
        enabled: true,
        source: "LEARNED",
      });
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success("Rule saved from history");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save rule from history",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="Loading tag rules" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-danger text-center py-8">
        Error loading tag rules: {error.message}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Tag rules</h2>
          <p className="text-sm text-text-muted mt-1">
            Suggest tags when transaction names match your keywords.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by tag, keyword, or rule..."
            className="sm:w-auto"
          />
          <Button
            variant="primary"
            clicked={() => {
              setSelectedRule(undefined);
              setIsDialogOpen(true);
            }}>
            <HiPlus className="size-4" />
            Add rule
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 border border-border rounded-lg">
          <HiOutlineQueueList className="size-10 mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">
            No rules yet. Add a rule or enable a preset below.
          </p>
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-8 border border-border rounded-lg">
          <p className="text-text-muted">
            No rules match your search.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-lg">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-text">
                    {rule.label || rule.tag?.name || "Untitled rule"}
                  </span>
                  <Badge variant="default">{SOURCE_LABELS[rule.source]}</Badge>
                  {!rule.enabled && <Badge variant="warning">Disabled</Badge>}
                </div>
                <p className="text-sm text-text-muted">
                  Tag:{" "}
                  <span className="inline-flex items-center gap-1.5">
                    {rule.tag?.color && (
                      <span
                        className="size-2.5 rounded-full inline-block"
                        style={{ backgroundColor: rule.tag.color }}
                      />
                    )}
                    {rule.tag?.name ?? "Unknown"}
                  </span>
                  {" · "}
                  Keywords: {rule.keywords.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  clicked={() => handleToggleRule(rule)}>
                  {rule.enabled ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="default"
                  clicked={() => {
                    setSelectedRule(rule);
                    setIsDialogOpen(true);
                  }}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  clicked={() => setDeleteTarget(rule)}>
                  <HiTrash className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {presets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text">Presets</h3>
          <p className="text-sm text-text-muted">
            Enable built-in merchant lists for your workspace.
          </p>
          {filteredPresets.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center border border-border rounded-lg">
              {hasSearchFilter
                ? "No presets match your search."
                : "No presets available."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPresets.map((preset) => {
                const isEnabled = enabledPresetIds.includes(preset.id);
                const recommendedTag = getRecommendedTagMetadataForPreset(
                  preset.tagName,
                );
                return (
                  <div
                    key={preset.id}
                    className="p-4 border border-border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      {recommendedTag?.emoticon && (
                        <span className="text-xl">{recommendedTag.emoticon}</span>
                      )}
                      {recommendedTag?.color && (
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: recommendedTag.color }}
                        />
                      )}
                      <div className="font-medium text-text">{preset.label}</div>
                    </div>
                    <p className="text-sm text-text-muted">
                      Suggests tag &quot;{preset.tagName}&quot; for{" "}
                      {preset.keywords.length} merchants
                    </p>
                    <Button
                      variant={isEnabled ? "default" : "primary"}
                      disabled={isEnabled || enablePresets.isPending}
                      clicked={() => handleEnablePreset(preset.id)}>
                      {isEnabled ? "Enabled" : "Enable preset"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {discoveries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text">
            Suggested from your history
          </h3>
          {filteredDiscoveries.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center border border-border rounded-lg">
              No history suggestions match your search.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredDiscoveries.map((discovery) => (
                <div
                  key={discovery.keyword}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-lg">
                  <div>
                    <p className="text-text">
                      You tagged <strong>{discovery.keyword}</strong> as{" "}
                      <strong>{discovery.tagName}</strong>{" "}
                      {discovery.count} times (
                      {Math.round(discovery.confidence * 100)}%)
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    disabled={createRule.isPending}
                    clicked={() => handlePromoteDiscovery(discovery)}>
                    Save as rule
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddOrEditTagRuleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rule={selectedRule}
      />

      <DeleteDialog
        title="Delete tag rule"
        content={`Are you sure you want to delete "${deleteTarget?.label || deleteTarget?.tag?.name}"?`}
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
    </div>
  );
}
