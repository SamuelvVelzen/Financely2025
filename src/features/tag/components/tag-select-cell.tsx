import { queryKeys } from "@/features/shared/query/keys";
import type {
  ITag,
  ITagMetadata,
  ITransactionType,
} from "@/features/shared/validation/schemas";
import { AddOrCreateTagDialog } from "@/features/tag/components/add-or-create-tag-dialog";
import { useTags } from "@/features/tag/hooks/useTags";
import { TagSelect } from "@/features/ui/tag-select/tag-select";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type ITagSelectCellProps = IPropsWithClassName & {
  // Tag metadata array
  tagMetadata?: ITagMetadata[];
  // Transaction type for filtering tags
  transactionType?: ITransactionType;
  // Single or multiple selection
  multiple?: boolean;
  // Placeholder text
  placeholder?: string;
} & {
  value: string | string[];
  onChange: (value: string | string[] | undefined) => void;
};

export function TagSelectCell({
  className = "",
  tagMetadata = [],
  transactionType,
  value,
  onChange,
  multiple = false,
  placeholder = multiple ? "Select tags..." : "Select tag...",
}: ITagSelectCellProps) {
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [pendingTagName, setPendingTagName] = useState<string>("");

  const queryClient = useQueryClient();

  // Build a map of tag names to tag IDs for quick lookup
  const tagNameToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    tags.forEach((tag) => {
      map.set(tag.name, tag.id);
    });
    return map;
  }, [tags]);

  // Build a map of tag names to metadata for quick lookup
  const tagMetadataMap = useMemo(() => {
    const map = new Map<string, ITagMetadata>();
    tagMetadata.forEach((metadata) => {
      map.set(metadata.name, metadata);
    });
    return map;
  }, [tagMetadata]);

  // Separate found tags (with IDs) from not-found tags (names only)
  const { foundTagIds, notFoundTagIds } = useMemo(() => {
    // Helper function to resolve a single tag value to either a tag ID or mark as not found
    // This logic is shared between multiple and single selection modes
    const resolveTagValue = (
      tagId: string
    ): { id: string } | { notFound: string } => {
      // Check if it's a tag name with metadata (found tag)
      const metadata = tagMetadataMap.get(tagId);
      if (metadata && metadata.id) {
        return { id: metadata.id };
      }

      // Check if it's already a tag ID (if name lookup failed, it might be an ID)
      const isTagId = tags.some((tag) => tag.id === tagId);
      if (isTagId) {
        return { id: tagId };
      }

      // It's neither a known tag name nor a tag ID (not found)
      return { notFound: tagId };
    };

    const foundIds: string[] = [];
    const notFoundNames: string[] = [];

    if (!value) {
      return {
        foundTagIds: multiple ? [] : undefined,
        notFoundTagIds: [],
      };
    }

    if (multiple && Array.isArray(value)) {
      // Multiple selection: iterate through array and resolve each value
      for (const val of value) {
        if (typeof val === "string") {
          const result = resolveTagValue(val);
          if ("id" in result) {
            foundIds.push(result.id);
          } else {
            notFoundNames.push(result.notFound);
          }
        }
      }
    } else if (!multiple && typeof value === "string") {
      // Single selection: resolve the single value
      const result = resolveTagValue(value);
      if ("id" in result) {
        foundIds.push(result.id);
      } else {
        notFoundNames.push(result.notFound);
      }
    }

    return {
      foundTagIds: multiple ? foundIds : (foundIds[0] as string | undefined),
      notFoundTagIds: notFoundNames,
    } as {
      foundTagIds: string | string[] | undefined;
      notFoundTagIds: string[];
    };
  }, [value, tagMetadataMap, tags, tagNameToIdMap, multiple]);

  // Handle tag creation success
  const handleTagCreated = (createdTag?: ITag) => {
    // Invalidate tags query to refresh the list
    queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
    setIsCreateDialogOpen(false);
    setPendingTagName("");

    // Auto-select the newly created tag and remove the not-found tag name
    if (createdTag) {
      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        // Remove the pending tag name and add the new tag ID
        const updatedValues = currentValues
          .filter((val) => val !== pendingTagName)
          .concat(createdTag.id);
        onChange(updatedValues);
      } else {
        onChange(createdTag.id);
      }
    }
  };

  // Combine found tag IDs with not-found tag names for the value prop
  const combinedValue = useMemo(() => {
    // Helper function to convert tag ID to name (or keep ID if transactionType matches)
    const convertTagIdToDisplayValue = (tagId: string): string => {
      const tag = tags.find((tag) => tag.id === tagId);
      if (tag?.transactionType === transactionType) {
        return tagId;
      }
      return tag?.name ?? tagId;
    };

    if (multiple) {
      const foundIds = Array.isArray(foundTagIds) ? foundTagIds : [];
      // Convert tag IDs to names (same logic as single select)
      const convertedValues = foundIds.map(convertTagIdToDisplayValue);
      return [...convertedValues, ...notFoundTagIds];
    } else {
      // For single select, convert tag ID to name if found, otherwise use not-found value
      if (foundTagIds && typeof foundTagIds === "string") {
        return convertTagIdToDisplayValue(foundTagIds);
      }

      return notFoundTagIds[0] ?? undefined;
    }
  }, [foundTagIds, notFoundTagIds, multiple, tags, transactionType]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* TagSelect component - not-found tags will be pre-filled in search input */}
      <div className="flex-1 min-w-[120px]">
        <TagSelect
          className={className}
          multiple={multiple}
          placeholder={placeholder}
          transactionType={transactionType}
          value={combinedValue ?? (multiple ? [] : "")}
          onChange={onChange}
        />
      </div>
      <AddOrCreateTagDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialName={pendingTagName}
        initialValues={{
          transactionType: transactionType || undefined,
        }}
        onSuccess={handleTagCreated}
      />
    </div>
  );
}
