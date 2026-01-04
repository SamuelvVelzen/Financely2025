"use client";

import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { queryKeys } from "@/features/shared/query/keys";
import {
  type ITag,
  type ITransactionType,
} from "@/features/shared/validation/schemas";
import { AddOrCreateTagDialog } from "@/features/tag/components/add-or-create-tag-dialog";
import { useTags } from "@/features/tag/hooks/useTags";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Select, type ISelectOption } from "../select/select";

export type ITagSelectProps = IPropsWithClassName & {
  name: string;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  transactionType?: ITransactionType;
  hint?: string;
};

export function TagSelect({
  className = "",
  name,
  multiple = false,
  placeholder = "Select tags...",
  label,
  searchPlaceholder = "Type to search tags...",
  disabled = false,
  transactionType,
  hint,
}: ITagSelectProps) {
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags) as ITag[];
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [pendingTagName, setPendingTagName] = useState<string>("");

  const queryClient = useQueryClient();
  const form = useFormContext();

  const { highlightText } = useHighlightText();

  // Filter tags based on transactionType
  // Show tags where transactionType matches the provided type
  const filteredTags = useMemo(() => {
    if (!transactionType) {
      return orderedTags;
    }
    return orderedTags.filter((tag) => tag.transactionType === transactionType);
  }, [orderedTags, transactionType]);

  // Convert tags to SelectOption format
  const tagOptions: ISelectOption<ITag>[] = useMemo(() => {
    return filteredTags.map((tag) => ({
      value: tag.id,
      label: tag.name,
      data: tag,
    }));
  }, [filteredTags]);

  // Handle create new tag
  const handleCreateNew = (searchQuery: string) => {
    setPendingTagName(searchQuery);
    setIsCreateDialogOpen(true);
  };

  // Handle tag creation success
  const handleTagCreated = (createdTag?: ITag) => {
    // Invalidate tags query to refresh the list
    queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
    setIsCreateDialogOpen(false);
    setPendingTagName("");

    // Auto-select the newly created tag
    if (createdTag) {
      const currentValue = form.getValues(name);
      if (multiple) {
        const currentValues = Array.isArray(currentValue) ? currentValue : [];
        if (!currentValues.includes(createdTag.id)) {
          form.setValue(name, [...currentValues, createdTag.id], {
            shouldValidate: true,
          });
        }
      } else {
        form.setValue(name, createdTag.id, { shouldValidate: true });
      }
    }
  };

  // Default rendering for tags (with emoticon and color indicator)
  const children = (
    option: ISelectOption<ITag>,
    index: number,
    context: {
      isSelected: boolean;
      handleClick: () => void;
      multiple: boolean;
      searchQuery: string;
    }
  ) => {
    return (
      <>
        {option.data?.emoticon && (
          <span className="text-base shrink-0">{option.data.emoticon}</span>
        )}
        {option.data?.color && (
          <div
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: option.data.color }}
          />
        )}
        <span>{highlightText(option.label, context.searchQuery)}</span>
      </>
    );
  };

  return (
    <>
      <Select<ISelectOption<ITag>>
        className={className}
        name={name}
        options={tagOptions}
        multiple={multiple}
        placeholder={placeholder}
        label={label}
        searchPlaceholder={searchPlaceholder}
        disabled={disabled}
        hint={hint}
        onCreateNew={handleCreateNew}
        createNewLabel={(query) => `Create tag "${query}"`}
        forcePlacement={["bottom"]}
        children={children}
      />
      <AddOrCreateTagDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialName={pendingTagName}
        onSuccess={handleTagCreated}
      />
    </>
  );
}
