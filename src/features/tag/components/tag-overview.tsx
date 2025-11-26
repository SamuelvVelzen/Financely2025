import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITag } from "@/features/shared/validation/schemas";
import {
  useDeleteTag,
  useReorderTags,
  useTags,
} from "@/features/tag/hooks/useTags";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { SortableList } from "@/features/ui/list/sortable-list";
import { SortableListItem } from "@/features/ui/list/sortable-list-item";
import { Title } from "@/features/ui/typography/title";
import { useState } from "react";
import {
  HiArrowDownTray,
  HiOutlineTag,
  HiPencil,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";
import { AddOrCreateTagDialog } from "./add-or-create-tag-dialog";
import { TagCsvImportDialog } from "./tag-csv-import-dialog";

export function TagOverview() {
  const { data, isLoading, error } = useTags();
  const tags = data?.data ?? [];
  const sortedTags = useOrderedData(tags);
  const { mutate: deleteTag } = useDeleteTag();
  const { mutate: reorderTags } = useReorderTags();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ITag | undefined>(undefined);

  const handleCreateTag = () => {
    setSelectedTag(undefined);
    setIsTagDialogOpen(true);
  };

  const handleEditTag = (tag: ITag) => {
    setSelectedTag(tag);
    setIsTagDialogOpen(true);
  };

  const handleDeleteClick = (tagId: string) => {
    setSelectedTag(tags.find((tag) => tag.id === tagId));
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTag) {
      deleteTag(selectedTag.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedTag(undefined);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTag(undefined);
  };

  const tagToDeleteData = selectedTag;

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiOutlineTag />

            <span>Tags</span>
          </div>

          <Dropdown>
            <DropdownItem icon={<HiPlus />} clicked={() => handleCreateTag()}>
              Add tag
            </DropdownItem>
            <DropdownItem
              icon={<HiArrowDownTray />}
              clicked={() => setIsCsvImportDialogOpen(true)}
            >
              Import from CSV
            </DropdownItem>
          </Dropdown>
        </Title>
      </Container>

      {isLoading && (
        <Container>
          <p className="text-text-muted text-center">Loading tags...</p>
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading tags: {error.message}
          </p>
        </Container>
      )}

      {!isLoading && !error && sortedTags.length === 0 && (
        <EmptyContainer
          icon={<HiOutlineTag />}
          emptyText={
            "No tags yet. Create your first tag to organize your finances."
          }
          button={{
            buttonText: "Add tag",
            buttonAction: () => handleCreateTag(),
          }}
        ></EmptyContainer>
      )}

      {!isLoading && !error && sortedTags.length > 0 && (
        <Container>
          <SortableList
            data={sortedTags}
            getItemId={(tag) => tag.id}
            onOrderChange={(orderedIds) => {
              reorderTags(
                { tagIds: orderedIds as string[] },
                {
                  onError: (error) => {
                    console.error("Failed to reorder tags:", error);
                    // Error is already handled by the hook (rollback)
                  },
                }
              );
            }}
          >
            {(tag, index, dragProps) => (
              <SortableListItem
                className="group"
                draggable={true}
                isDragging={dragProps.isDragging}
                isDragOver={dragProps.isDragOver}
                isOriginalPosition={dragProps.isOriginalPosition}
                draggedItemHeight={dragProps.draggedItemHeight}
                onDragStart={dragProps.onDragStart}
                onDragOver={dragProps.onDragOver}
                onDragEnd={dragProps.onDragEnd}
                onDrop={dragProps.onDrop}
              >
                <div className="flex items-center gap-3">
                  {tag.color && (
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  <span className="text-text">{tag.name}</span>
                  {tag.description && (
                    <span className="text-sm text-text-muted">
                      {tag.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
                  <IconButton
                    clicked={() => handleEditTag(tag)}
                    className="text-text-muted hover:text-text p-1"
                  >
                    <HiPencil className="w-5 h-5" />
                  </IconButton>
                  <IconButton
                    clicked={() => handleDeleteClick(tag.id)}
                    className="text-danger hover:text-danger-hover p-1"
                  >
                    <HiTrash className="w-5 h-5" />
                  </IconButton>
                </div>
              </SortableListItem>
            )}
          </SortableList>
        </Container>
      )}

      <AddOrCreateTagDialog
        open={isTagDialogOpen}
        onOpenChange={setIsTagDialogOpen}
        tag={selectedTag}
      />

      <DeleteDialog
        title="Delete Tag"
        content={`Are you sure you want to delete the tag "${selectedTag?.name}"? This action cannot be undone.`}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: handleDeleteCancel,
          },
          {
            buttonContent: "Delete",
            clicked: handleDeleteConfirm,
            variant: "danger",
          },
        ]}
      />

      <TagCsvImportDialog
        open={isCsvImportDialogOpen}
        onOpenChange={setIsCsvImportDialogOpen}
        onSuccess={() => {
          // Tags will be refetched automatically via query invalidation
        }}
      />
    </>
  );
}
