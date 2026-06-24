import type { ITagRule, ITransactionType } from "@/features/shared/validation/schemas";
import { applyTagSuggestionsToCandidates } from "@/features/tag-rule/utils/apply-tag-suggestions-to-candidate";
import { useTags } from "@/features/tag/hooks/useTags";
import { Button } from "@/features/ui/button/button";
import {
  type IStepConfig,
  type IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { useCallback, useMemo, useState } from "react";
import { HiOutlineQueueList } from "react-icons/hi2";
import { ImportReviewTagRulesDialog } from "./import-review-tag-rules-dialog";
import { ReviewStepContent } from "./review-step-content";
import {
  type IStep,
  useTransactionImportContext,
} from "./transaction-import-context";

export function useReviewStep(): IStepConfig<IStep> {
  const ctx = useTransactionImportContext();
  const { data: tagsData } = useTags();

  const [errorDialogRowIndex, setErrorDialogRowIndex] = useState<number | null>(
    null,
  );
  const [tagRulesOpen, setTagRulesOpen] = useState(false);

  const tagTransactionTypes = useMemo(() => {
    const map = new Map<string, ITransactionType>();
    for (const tag of tagsData?.data ?? []) {
      map.set(tag.id, tag.transactionType);
    }
    return map;
  }, [tagsData?.data]);

  const handleRulesUpdated = useCallback(
    (rules: ITagRule[]) => {
      ctx.setCandidates((prev) =>
        applyTagSuggestionsToCandidates(prev, rules, tagTransactionTypes),
      );
    },
    [ctx.setCandidates, tagTransactionTypes],
  );

  return {
    title: "Review Transactions",
    size: "full",
    headerActions: (
      <Button
        type="button"
        variant="default"
        size="sm"
        clicked={() => setTagRulesOpen(true)}>
        <HiOutlineQueueList className="size-4" />
        Tagging rules
      </Button>
    ),
    content: () => (
      <>
        <ReviewStepContent
          errorDialogRowIndex={errorDialogRowIndex}
          setErrorDialogRowIndex={setErrorDialogRowIndex}
        />
        <ImportReviewTagRulesDialog
          open={tagRulesOpen}
          onOpenChange={setTagRulesOpen}
          onRulesUpdated={handleRulesUpdated}
        />
      </>
    ),
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => navigation.goToStep("mapping"),
        buttonContent: "Back",
      },
      {
        clicked: () => {
          if (ctx.selectedRows.size > 0) {
            navigation.goToStep("confirm");
          }
        },
        variant: "primary",
        disabled: ctx.selectedRows.size === 0,
        buttonContent: `Continue to import ${ctx.selectedRows.size} transaction${ctx.selectedRows.size !== 1 ? "s" : ""}`,
      },
    ],
  };
}
