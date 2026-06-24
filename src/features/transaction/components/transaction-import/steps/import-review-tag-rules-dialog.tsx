import type { ITagRule } from "@/features/shared/validation/schemas";
import { TagRulesPanel } from "@/features/tag-rule/components/tag-rules-panel";
import { useTagRules } from "@/features/tag-rule/hooks/useTagRules";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { useEffect, useMemo, useRef } from "react";

type IImportReviewTagRulesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRulesUpdated: (rules: ITagRule[]) => void;
};

function getRulesRevision(rules: ITagRule[]): string {
  return rules
    .map(
      (rule) =>
        `${rule.id}:${rule.enabled}:${rule.updatedAt}:${rule.keywords.join(",")}`,
    )
    .join("|");
}

export function ImportReviewTagRulesDialog({
  open,
  onOpenChange,
  onRulesUpdated,
}: IImportReviewTagRulesDialogProps) {
  const { data } = useTagRules();
  const onRulesUpdatedRef = useRef(onRulesUpdated);
  onRulesUpdatedRef.current = onRulesUpdated;

  const rulesRevision = useMemo(
    () => (data?.data ? getRulesRevision(data.data) : ""),
    [data?.data],
  );

  useEffect(() => {
    if (!open || !data?.data) {
      return;
    }
    onRulesUpdatedRef.current(data.data);
  }, [open, rulesRevision]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tagging rules"
      size="3/4"
      content={
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Manage rules for this workspace. Changes recalculate tag suggestions
            in the review table.
          </p>
          <TagRulesPanel />
        </div>
      }
      footerButtons={[
        {
          clicked: () => onOpenChange(false),
          buttonContent: "Close",
        },
      ]}
    />
  );
}
