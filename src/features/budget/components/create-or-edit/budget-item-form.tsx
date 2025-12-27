"use client";

import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITag } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { Accordion } from "@/features/ui/accordion/accordion";
import { IconButton } from "@/features/ui/button/icon-button";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Label } from "@/features/ui/typography/label";
import { useEffect, useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { HiSquares2X2, HiTrash } from "react-icons/hi2";

type IBudgetItemFormProps = {
  selectedTagIds?: string[];
};

export function BudgetItemForm({ selectedTagIds = [] }: IBudgetItemFormProps) {
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
    name: "budget.items",
  });

  // Sync fields with selected tags
  useEffect(() => {
    const currentItems = form.getValues("budget.items") ?? [];
    const currentTagIds = currentItems
      .map((item: any) => item.tagId)
      .filter((id: string | null): id is string => id !== null);
    const currentHasMisc = currentItems.some(
      (item: any) => item.tagId === null
    );

    // Remove items for tags that are no longer selected (but always keep misc item)
    const itemsToKeep = currentItems.filter((item: any) => {
      if (item.tagId === null) return true; // Always keep misc item
      return selectedTagIds.includes(item.tagId);
    });

    // Add items for newly selected tags
    const newTagIds = selectedTagIds.filter(
      (id) => !currentTagIds.includes(id)
    );
    newTagIds.forEach((tagId) => {
      itemsToKeep.push({ tagId });
    });

    // Always ensure misc item exists
    if (!currentHasMisc) {
      itemsToKeep.push({ tagId: null });
    }

    form.setValue("budget.items", itemsToKeep, { shouldValidate: false });
  }, [selectedTagIds]);

  const getTagName = (tagId: string | null) => {
    if (tagId === null) return "Miscellaneous";
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.name ?? "Unknown";
  };

  const getTagColor = (tagId: string | null) => {
    if (tagId === null) return null;
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.color ?? null;
  };

  const getTagTransactionType = (
    tagId: string | null
  ): "EXPENSE" | "INCOME" | null => {
    if (tagId === null) return null;
    const tag = selectedTags.find((t) => t.id === tagId);
    return tag?.transactionType ?? null;
  };

  // Watch all budget items to make grouping reactive
  const budgetItems = form.watch("budget.items") as
    | Array<{ tagId: string | null; expectedAmount: string }>
    | undefined;

  // Group fields by transaction type
  const groupedFields = useMemo(() => {
    const expenseFields: Array<{ field: any; index: number }> = [];
    const incomeFields: Array<{ field: any; index: number }> = [];
    const bothFields: Array<{ field: any; index: number }> = [];

    fields.forEach((field, index) => {
      const tagId = budgetItems?.[index]?.tagId ?? null;
      if (tagId !== null) {
        const transactionType = getTagTransactionType(tagId);
        if (transactionType === "EXPENSE") {
          expenseFields.push({ field, index });
        } else if (transactionType === "INCOME") {
          incomeFields.push({ field, index });
        } else {
          bothFields.push({ field, index });
        }
      } else {
        bothFields.push({ field, index });
      }
    });

    return { expenseFields, incomeFields, bothFields };
  }, [fields, budgetItems, selectedTags]);

  const renderBudgetItem = (field: any, index: number) => {
    const tagId = form.watch(`budget.items.${index}.tagId`) as string | null;
    const tagName = getTagName(tagId);
    const tagColor = getTagColor(tagId);

    return (
      <ListItem className="flex items-center gap-4 p-3">
        {tagColor ? (
          <div className="size-5 flex items-center justify-center">
            <span
              className="size-3 rounded-full block"
              style={{ backgroundColor: tagColor }}></span>
          </div>
        ) : (
          <HiSquares2X2 className="size-5 shrink-0 text-text-muted" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{tagName}</div>
        </div>
        <div className="w-32">
          <DecimalInput name={`budget.items.${index}.expectedAmount`} />
        </div>
        <IconButton
          size="sm"
          clicked={() => {
            // Don't allow removing the miscellaneous item
            if (tagId === null) {
              return;
            }
            remove(index);
          }}
          aria-label="Remove"
          disabled={tagId === null}>
          <HiTrash />
        </IconButton>
      </ListItem>
    );
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
      <div className="space-y-4">
        {/* Expense Tags Section */}
        {groupedFields.expenseFields.length > 0 && (
          <Accordion
            title="Expense Tags"
            defaultOpen={true}>
            <List
              data={groupedFields.expenseFields}
              getItemKey={(item) => item.field.id}>
              {({ field, index }) => renderBudgetItem(field, index)}
            </List>
          </Accordion>
        )}

        {/* Income Tags Section */}
        {groupedFields.incomeFields.length > 0 && (
          <Accordion
            title="Income Tags"
            defaultOpen={true}>
            <List
              data={groupedFields.incomeFields}
              getItemKey={(item) => item.field.id}>
              {({ field, index }) => renderBudgetItem(field, index)}
            </List>
          </Accordion>
        )}

        {/* Tags for Both Section (includes Miscellaneous) */}
        {groupedFields.bothFields.length > 0 && (
          <Accordion
            title="Tags for Both"
            defaultOpen={true}>
            <List
              data={groupedFields.bothFields}
              getItemKey={(item) => item.field.id}>
              {({ field, index }) => renderBudgetItem(field, index)}
            </List>
          </Accordion>
        )}
      </div>
    </div>
  );
}
