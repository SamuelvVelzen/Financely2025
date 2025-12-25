"use client";

import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITag } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { Label } from "@/features/ui/typography/label";
import { IconButton } from "@/features/ui/button/icon-button";
import { useMemo, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { HiTrash } from "react-icons/hi2";

type IBudgetItemFormProps = {
  selectedTagIds?: string[];
  includeMisc?: boolean;
};

export function BudgetItemForm({
  selectedTagIds = [],
  includeMisc = false,
}: IBudgetItemFormProps) {
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags) as ITag[];
  const form = useFormContext();

  // Get selected tags
  const selectedTags = useMemo(() => {
    return orderedTags.filter((tag) => selectedTagIds.includes(tag.id));
  }, [orderedTags, selectedTagIds]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Sync fields with selected tags
  useEffect(() => {
    const currentItems = form.getValues("items") ?? [];
    const currentTagIds = currentItems.map((item: any) => item.tagId).filter((id): id is string => id !== null);
    const currentHasMisc = currentItems.some((item: any) => item.tagId === null);

    // Remove items for tags that are no longer selected
    const itemsToKeep = currentItems.filter((item: any) => {
      if (item.tagId === null) return includeMisc;
      return selectedTagIds.includes(item.tagId);
    });

    // Add items for newly selected tags
    const newTagIds = selectedTagIds.filter((id) => !currentTagIds.includes(id));
    newTagIds.forEach((tagId) => {
      itemsToKeep.push({ tagId, expectedAmount: "0" });
    });

    // Add/remove Misc item
    if (includeMisc && !currentHasMisc) {
      itemsToKeep.push({ tagId: null, expectedAmount: "0" });
    } else if (!includeMisc && currentHasMisc) {
      const miscIndex = itemsToKeep.findIndex((item: any) => item.tagId === null);
      if (miscIndex !== -1) {
        itemsToKeep.splice(miscIndex, 1);
      }
    }

    form.setValue("items", itemsToKeep, { shouldValidate: false });
  }, [selectedTagIds, includeMisc, form]);

  const getTagName = (tagId: string | null) => {
    if (tagId === null) return "Misc (Untagged Transactions)";
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.name ?? "Unknown";
  };

  const getTagColor = (tagId: string | null) => {
    if (tagId === null) return null;
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.color ?? null;
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        Select tags above to set budget amounts
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Set Expected Amounts</Label>
      <div className="space-y-3">
        {fields.map((field, index) => {
          const tagId = form.watch(`items.${index}.tagId`) as string | null;
          const tagName = getTagName(tagId);
          const tagColor = getTagColor(tagId);

          return (
            <div
              key={field.id}
              className="flex items-center gap-4 p-3 border border-border rounded-md bg-surface">
              {tagColor && (
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: tagColor }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{tagName}</div>
              </div>
              <div className="w-32">
                <DecimalInput
                  name={`items.${index}.expectedAmount`}
                  placeholder={0}
                />
              </div>
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                aria-label="Remove">
                <HiTrash />
              </IconButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}

