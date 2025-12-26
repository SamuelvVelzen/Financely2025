"use client";

import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITag } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { Label } from "@/features/ui/typography/label";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

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

  const selectedTagIds = form.watch(name) as string[] | undefined;

  const handleTagToggle = (tagId: string) => {
    const current = selectedTagIds ?? [];
    if (current.includes(tagId)) {
      form.setValue(
        name,
        current.filter((id) => id !== tagId),
        { shouldValidate: true }
      );
    } else {
      form.setValue(name, [...current, tagId], { shouldValidate: true });
    }
  };

  const handleSelectAll = () => {
    const allTagIds = filteredTags.map((tag) => tag.id);
    form.setValue(name, allTagIds, { shouldValidate: true });
  };

  const handleDeselectAll = () => {
    form.setValue(name, [], { shouldValidate: true });
  };

  const selectedCount = selectedTagIds?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Select Tags to Budget</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-primary hover:text-primary-hover">
            Select All
          </button>
          <span className="text-text-muted">|</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-sm text-primary hover:text-primary-hover">
            Deselect All
          </button>
        </div>
      </div>

      <div className="text-sm text-text-muted">
        {selectedCount} tag{selectedCount !== 1 ? "s" : ""} selected
      </div>

      <div className="space-y-2">
        {filteredTags.map((tag) => {
          const isSelected = selectedTagIds?.includes(tag.id) ?? false;
          return (
            <div
              key={tag.id}
              className="flex items-center gap-3 p-2 hover:bg-surface-hover rounded">
              <Checkbox
                checked={isSelected}
                onChange={() => handleTagToggle(tag.id)}
              />
              {tag.color && (
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
              )}
              <span className="flex-1">{tag.name}</span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm text-text-muted">
          Transactions without tags will automatically be counted toward the
          "Miscellaneous" category
        </p>
      </div>
    </div>
  );
}
