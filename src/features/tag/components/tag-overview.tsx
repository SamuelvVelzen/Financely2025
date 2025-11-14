import {
  useCreateTag,
  useDeleteTag,
  useTags,
} from "@/features/tag/hooks/useTags";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Title } from "@/features/ui/typography/title";
import { useState } from "react";
import { HiOutlineTag, HiTrash } from "react-icons/hi2";

export function TagOverview() {
  const { data, isLoading, error } = useTags();
  const tags = data?.data ?? [];
  const { mutate: createTag } = useCreateTag();
  const { mutate: deleteTag } = useDeleteTag();
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCreateTag = () => {
    // TODO: Add form/dialog to collect tag name, color, description
    createTag({
      name: "New Tag",
      color: "#000000",
    });
  };

  const handleDeleteClick = (tagId: string) => {
    setTagToDelete(tagId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (tagToDelete) {
      deleteTag(tagToDelete, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setTagToDelete(null);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setTagToDelete(null);
  };

  const tagToDeleteData = tags.find((tag) => tag.id === tagToDelete);

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiOutlineTag />

            <span>Tags</span>
          </div>

          <Dropdown>
            <DropdownItem
              icon={<HiOutlineTag />}
              clicked={() => handleCreateTag()}>
              Add tag
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

      {!isLoading && !error && tags.length === 0 && (
        <EmptyContainer
          icon={<HiOutlineTag />}
          emptyText={
            "No tags yet. Create your first tag to organize your finances."
          }
          button={{
            buttonText: "Add tag",
            buttonAction: () => handleCreateTag(),
          }}></EmptyContainer>
      )}

      {!isLoading && !error && tags.length > 0 && (
        <Container>
          <List data={tags}>
            {(tag) => (
              <ListItem className="group">
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
                <IconButton
                  clicked={() => handleDeleteClick(tag.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-danger hover:text-danger-hover p-1">
                  <HiTrash className="w-5 h-5" />
                </IconButton>
              </ListItem>
            )}
          </List>
        </Container>
      )}

      <DeleteDialog
        title="Delete Tag"
        content={
          tagToDeleteData
            ? `Are you sure you want to delete the tag "${tagToDeleteData.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this tag? This action cannot be undone."
        }
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: handleDeleteCancel,
            className: "hover:bg-surface-hover",
          },
          {
            buttonContent: "Delete",
            clicked: handleDeleteConfirm,
            variant: "danger",
          },
        ]}
      />
    </>
  );
}
