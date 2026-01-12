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
  const { foundTagIds, notFoundTagNames } = useMemo(() => {
    const foundIds: string[] = [];
    const notFoundNames: string[] = [];

    if (!value) {
      return {
        foundTagIds: multiple ? [] : undefined,
        notFoundTagNames: [],
      };
    }

    if (multiple && Array.isArray(value)) {
      for (const val of value) {
        if (typeof val === "string") {
          // Check if it's a tag name with metadata (found tag)
          const metadata = tagMetadataMap.get(val);
          if (metadata && metadata.id) {
            foundIds.push(metadata.id);
          } else {
            // Check if it's already a tag ID (check if it exists in tags)
            const isTagId = tags.some((tag) => tag.id === val);
            if (isTagId) {
              foundIds.push(val);
            } else {
              // Check if tag name exists in database (but wasn't in metadata)
              const tagIdFromName = tagNameToIdMap.get(val);
              if (tagIdFromName) {
                foundIds.push(tagIdFromName);
              } else {
                // It's a tag name without metadata and not in database (not found)
                notFoundNames.push(val);
              }
            }
          }
        }
      }
    } else if (!multiple && typeof value === "string") {
      const metadata = tagMetadataMap.get(value);
      if (metadata && metadata.id) {
        foundIds.push(metadata.id);
      } else {
        const isTagId = tags.some((tag) => tag.id === value);
        if (isTagId) {
          foundIds.push(value);
        } else {
          const tagIdFromName = tagNameToIdMap.get(value);
          if (tagIdFromName) {
            foundIds.push(tagIdFromName);
          } else {
            notFoundNames.push(value);
          }
        }
      }
    }

    return {
      foundTagIds: multiple ? foundIds : (foundIds[0] as string | undefined),
      notFoundTagNames: notFoundNames,
    } as {
      foundTagIds: string | string[] | undefined;
      notFoundTagNames: string[];
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
    if (multiple) {
      const foundIds = Array.isArray(foundTagIds) ? foundTagIds : [];
      return [...foundIds, ...notFoundTagNames];
    } else {
      // For single select, prefer found tag ID, otherwise use not-found tag name
      return foundTagIds ?? (notFoundTagNames[0] || undefined);
    }
  }, [foundTagIds, notFoundTagNames, multiple]);

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
