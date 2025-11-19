"use client";

import { queryKeys } from "@/features/shared/query/keys";
import { type ITag } from "@/features/shared/validation/schemas";
import { AddOrCreateTagDialog } from "@/features/tag/components/add-or-create-tag-dialog";
import { useTags } from "@/features/tag/hooks/useTags";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Select, type ISelectOption } from "../select/select";

export type ITagSelectProps = IPropsWithClassName & {
  name: string;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  children?: (
    option: ISelectOption<ITag>,
    index: number,
    context: {
      isSelected: boolean;
      handleClick: () => void;
      multiple: boolean;
    }
  ) => ReactNode;
};

export function TagSelect({
  className = "",
  name,
  multiple = false,
  placeholder = "Select tags...",
  label,
  searchPlaceholder = "Type to search tags...",
  disabled = false,
  children,
}: ITagSelectProps) {
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [pendingTagName, setPendingTagName] = useState<string>("");
  const queryClient = useQueryClient();
  const form = useFormContext();

  // Convert tags to SelectOption format
  const tagOptions: ISelectOption<ITag>[] = useMemo(() => {
    return tags.map((tag) => ({
      value: tag.id,
      label: tag.name,
      data: tag,
    }));
  }, [tags]);

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

  // Default rendering for tags (with color indicator)
  const defaultChildren = (
    option: ISelectOption<ITag>,
    index: number,
    context: {
      isSelected: boolean;
      handleClick: () => void;
      multiple: boolean;
    }
  ) => {
    return (
      <>
        {option.data?.color && (
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: option.data.color }}
          />
        )}
        <span className="flex-1">{option.label}</span>
      </>
    );
  };

  return (
    <>
      <Select<ISelectOption<ITag>[], ITag>
        className={className}
        name={name}
        options={tagOptions}
        multiple={multiple}
        placeholder={placeholder}
        label={label}
        searchPlaceholder={searchPlaceholder}
        disabled={disabled}
        onCreateNew={handleCreateNew}
        createNewLabel={(query) => `Create tag "${query}"`}
        forcePlacement={["bottom"]}
        children={children || defaultChildren}
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
