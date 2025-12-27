import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITag } from "@/features/shared/validation/schemas";
import {
  useDeleteTag,
  useReorderTags,
  useTags,
} from "@/features/tag/hooks/useTags";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { SortableList } from "@/features/ui/list/sortable-list";
import { SortableListItem } from "@/features/ui/list/sortable-list-item";
import { Loading } from "@/features/ui/loading/loading";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { useMemo, useState } from "react";
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
  const sortedTags = useOrderedData(tags) as ITag[];
  const { mutate: deleteTag } = useDeleteTag();
  const { mutate: reorderTags } = useReorderTags();
  const toast = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ITag | undefined>(undefined);

  // Separate tags into three sections
  const expenseTags = useMemo(
    () => sortedTags.filter((tag) => tag.transactionType === "EXPENSE"),
    [sortedTags]
  );
  const incomeTags = useMemo(
    () => sortedTags.filter((tag) => tag.transactionType === "INCOME"),
    [sortedTags]
  );
  const bothTags = useMemo(
    () => sortedTags.filter((tag) => tag.transactionType === null),
    [sortedTags]
  );

  // Helper function to handle reordering within a section
  // Merges the reordered section tags back into the global order
  const handleSectionReorder = (sectionTagIds: string[], allTags: ITag[]) => {
    // Create a map of all tags by ID
    const tagMap = new Map(allTags.map((tag) => [tag.id, tag]));

    // Create ordered list starting with section tags
    const reorderedIds: string[] = [];

    // First, add all section tags in their new order
    sectionTagIds.forEach((tagId) => {
      if (tagMap.has(tagId)) {
        reorderedIds.push(tagId);
      }
    });

    // Then, add remaining tags (from other sections) maintaining their relative order
    allTags.forEach((tag) => {
      if (!sectionTagIds.includes(tag.id)) {
        reorderedIds.push(tag.id);
      }
    });

    // Reorder all tags based on the merged order
    reorderTags(
      { tagIds: reorderedIds },
      {
        onError: (error: Error) => {
          console.error("Failed to reorder tags:", error);
          // Error is already handled by the hook (rollback)
        },
      }
    );
  };

  const handleCreateTag = () => {
    setSelectedTag(undefined);
    setIsTagDialogOpen(true);
  };

  const handleEditTag = (tag: ITag) => {
    setSelectedTag(tag);
    setIsTagDialogOpen(true);
  };

  const handleDeleteClick = (tagId: string) => {
    setSelectedTag(tags.find((tag: ITag) => tag.id === tagId));
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTag) {
      deleteTag(selectedTag.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedTag(undefined);
          toast.success("Tag deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete tag");
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
      <Container>
        <Title className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <div className="flex gap-2 items-center">
            <HiOutlineTag />
            <span>Tags</span>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              clicked={handleCreateTag}
              variant="primary"
              size="sm">
              <HiPlus className="size-6" /> Add
            </Button>

            <Dropdown>
              <DropdownItem
                icon={<HiArrowDownTray />}
                clicked={() => setIsCsvImportDialogOpen(true)}>
                Import from CSV
              </DropdownItem>
            </Dropdown>
          </div>
        </Title>
      </Container>

      {isLoading && (
        <Container>
          <Loading text="Loading tags" />
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading tags: {error.message}
          </p>
        </Container>
      )}

      {!isLoading && !error && (
        <>
          {sortedTags.length === 0 && (
            <Container>
              <EmptyPage
                icon={HiOutlineTag}
                emptyText={
                  "No tags yet. Create your first tag to organize your finances."
                }
                button={{
                  buttonContent: "Add tag",
                  clicked: handleCreateTag,
                }}></EmptyPage>
            </Container>
          )}

          {sortedTags.length > 0 && (
            <div className="space-y-6">
              {/* Expense Tags Section */}
              {expenseTags.length > 0 && (
                <Container>
                  <h2 className="text-lg font-semibold mb-4 text-text">
                    Expense Tags
                  </h2>
                  <SortableList
                    data={expenseTags}
                    getItemId={(tag) => tag.id}
                    onOrderChange={(orderedIds) => {
                      handleSectionReorder(orderedIds as string[], sortedTags);
                    }}>
                    {(tag: ITag, index, dragProps) => (
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
                        onDrop={dragProps.onDrop}>
                        <div className="flex items-center gap-3">
                          {tag.color && (
                            <div
                              className="size-4 rounded"
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
                          <IconButton clicked={() => handleEditTag(tag)}>
                            <HiPencil className="size-5" />
                          </IconButton>
                          <IconButton
                            clicked={() => handleDeleteClick(tag.id)}
                            className="text-danger hover:text-danger-hover">
                            <HiTrash className="size-5" />
                          </IconButton>
                        </div>
                      </SortableListItem>
                    )}
                  </SortableList>
                </Container>
              )}

              {/* Income Tags Section */}
              {incomeTags.length > 0 && (
                <Container>
                  <h2 className="text-lg font-semibold mb-4 text-text">
                    Income Tags
                  </h2>
                  <SortableList
                    data={incomeTags}
                    getItemId={(tag) => tag.id}
                    onOrderChange={(orderedIds) => {
                      handleSectionReorder(orderedIds as string[], sortedTags);
                    }}>
                    {(tag: ITag, index, dragProps) => (
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
                        onDrop={dragProps.onDrop}>
                        <div className="flex items-center gap-3">
                          {tag.color && (
                            <div
                              className="size-4 rounded"
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
                          <IconButton clicked={() => handleEditTag(tag)}>
                            <HiPencil className="size-5" />
                          </IconButton>
                          <IconButton
                            clicked={() => handleDeleteClick(tag.id)}
                            className="text-danger hover:text-danger-hover">
                            <HiTrash className="size-5" />
                          </IconButton>
                        </div>
                      </SortableListItem>
                    )}
                  </SortableList>
                </Container>
              )}

              {/* Tags for Both Section */}
              {bothTags.length > 0 && (
                <Container>
                  <h2 className="text-lg font-semibold mb-4 text-text">
                    Tags for Both
                  </h2>
                  <SortableList
                    data={bothTags}
                    getItemId={(tag) => tag.id}
                    onOrderChange={(orderedIds) => {
                      handleSectionReorder(orderedIds as string[], sortedTags);
                    }}>
                    {(tag: ITag, index, dragProps) => (
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
                        onDrop={dragProps.onDrop}>
                        <div className="flex items-center gap-3">
                          {tag.color && (
                            <div
                              className="size-4 rounded"
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
                          <IconButton clicked={() => handleEditTag(tag)}>
                            <HiPencil className="size-5" />
                          </IconButton>
                          <IconButton
                            clicked={() => handleDeleteClick(tag.id)}
                            className="text-danger hover:text-danger-hover">
                            <HiTrash className="size-5" />
                          </IconButton>
                        </div>
                      </SortableListItem>
                    )}
                  </SortableList>
                </Container>
              )}
            </div>
          )}
        </>
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
