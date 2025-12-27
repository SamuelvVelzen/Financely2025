"use client";

import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITag } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { Accordion } from "@/features/ui/accordion/accordion";
import { SelectableList } from "@/features/ui/list/selectable-list";
import { SelectableListItem } from "@/features/ui/list/selectable-list-item";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { HiInformationCircle } from "react-icons/hi2";

type IBudgetTagSelectorProps = {
  name?: string;
  transactionType?: "EXPENSE" | "INCOME";
};

export function BudgetTagSelector({
  name = "tags.selectedTagIds",
  transactionType,
}: IBudgetTagSelectorProps) {
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags) as ITag[];
  const form = useFormContext();

  // Filter tags based on transactionType
  const filteredTags = useMemo(() => {
    if (!transactionType) {
      return orderedTags;
    }
    return orderedTags.filter(
      (tag) =>
        tag.transactionType === null || tag.transactionType === transactionType
    );
  }, [orderedTags, transactionType]);

  // Separate tags into three sections
  const expenseTags = useMemo(
    () => filteredTags.filter((tag) => tag.transactionType === "EXPENSE"),
    [filteredTags]
  );
  const incomeTags = useMemo(
    () => filteredTags.filter((tag) => tag.transactionType === "INCOME"),
    [filteredTags]
  );
  const bothTags = useMemo(
    () => filteredTags.filter((tag) => tag.transactionType === null),
    [filteredTags]
  );

  const selectedTagIds = (form.watch(name) as string[] | undefined) ?? [];

  const handleSelectionChange = (newSelectedIds: (string | number)[]) => {
    form.setValue(name, newSelectedIds, {
      shouldValidate: form.formState.isSubmitted,
    });
  };

  const handleSelectAll = () => {
    const allTagIds = filteredTags.map((tag) => tag.id);
    form.setValue(name, allTagIds, {
      shouldValidate: form.formState.isSubmitted,
    });
  };

  const handleDeselectAll = () => {
    form.setValue(name, [], { shouldValidate: form.formState.isSubmitted });
  };

  const selectedCount = selectedTagIds.length;

  const renderTagList = (tags: ITag[]) => {
    if (tags.length === 0) return null;

    return (
      <SelectableList
        data={tags}
        selectedIds={selectedTagIds}
        onSelectionChange={handleSelectionChange}
        getItemId={(tag) => tag.id}>
        {(tag, index, { checked, onChange, checkboxId }) => {
          return (
            <SelectableListItem
              checked={checked}
              onChange={onChange}
              checkboxId={checkboxId}>
              {tag.color && (
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: tag.color,
                  }}
                />
              )}
              <span
                className={cn(
                  "flex-1 text-sm",
                  checked ? "font-medium text-text" : "text-text-muted"
                )}>
                {tag.name}
              </span>
            </SelectableListItem>
          );
        }}
      </SelectableList>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <Label className="text-base font-semibold">
            Select Tags to Budget
          </Label>
          <div className="text-sm text-text-muted mt-1">
            {selectedCount} tag{selectedCount !== 1 ? "s" : ""} selected
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm font-medium text-primary hover:text-primary-hover">
            Select All
          </button>
          <span className="text-text-muted/50">|</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-sm font-medium text-primary hover:text-primary-hover">
            Deselect All
          </button>
        </div>
      </div>

      {/* Tag Sections */}
      <div className="space-y-6">
        {/* Expense Tags Section */}
        {expenseTags.length > 0 && (
          <div className="space-y-3">
            <Accordion
              title="Expense Tags"
              defaultOpen={true}>
              {renderTagList(expenseTags)}
            </Accordion>
          </div>
        )}

        {/* Income Tags Section */}
        {incomeTags.length > 0 && (
          <div className="space-y-3">
            <Accordion
              title="Income Tags"
              defaultOpen={true}>
              {renderTagList(incomeTags)}
            </Accordion>
          </div>
        )}

        {/* Tags for Both Section */}
        {bothTags.length > 0 && (
          <div className="space-y-3">
            <Accordion
              title="Tags for Both"
              defaultOpen={true}>
              {renderTagList(bothTags)}
            </Accordion>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="border-t border-border pt-4 mt-6 flex items-center gap-2">
        <HiInformationCircle className="size-4" />
        <p className="text-sm text-text-muted">
          Transactions without tags will automatically be counted toward the
          "Miscellaneous" category
        </p>
      </div>
    </div>
  );
}
