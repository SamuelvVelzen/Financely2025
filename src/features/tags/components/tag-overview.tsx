import {
  useCreateTag,
  useDeleteTag,
  useTags,
} from "@/features/tags/hooks/useTags";
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
  const labels = data?.data ?? [];
  const { mutate: createTag } = useCreateTag();
  const { mutate: deleteTag } = useDeleteTag();
  const [labelToDelete, setLabelToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const createLabel = () => {
    // TODO: Add form/dialog to collect tag name, color, description
    createTag({
      name: "New Tag",
      color: "#000000",
    });
  };

  const handleDeleteClick = (labelId: string) => {
    setLabelToDelete(labelId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (labelToDelete) {
      deleteTag(labelToDelete, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setLabelToDelete(null);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setLabelToDelete(null);
  };

  const labelToDeleteData = labels.find((label) => label.id === labelToDelete);

  return (
    <>
      <Container className="mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2">
            <HiOutlineTag />

            <span>Labels</span>
          </div>

          <Dropdown>
            <DropdownItem
              icon={<HiOutlineTag />}
              clicked={() => createLabel()}>
              Add label
            </DropdownItem>
          </Dropdown>
        </Title>
      </Container>

      {isLoading && (
        <Container>
          <p className="text-text-muted text-center">Loading labels...</p>
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading labels: {error.message}
          </p>
        </Container>
      )}

      {!isLoading && !error && labels.length === 0 && (
        <EmptyContainer
          icon={<HiOutlineTag />}
          emptyText={
            "No labels yet. Create your first label to organize your finances."
          }
          button={{
            buttonText: "Add label",
            buttonAction: () => createLabel(),
          }}></EmptyContainer>
      )}

      {!isLoading && !error && labels.length > 0 && (
        <Container>
          <List data={labels}>
            {(label) => (
              <ListItem className="group">
                <div className="flex items-center gap-3">
                  {label.color && (
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: label.color }}
                    />
                  )}
                  <span className="text-text">{label.name}</span>
                  {label.description && (
                    <span className="text-sm text-text-muted">
                      {label.description}
                    </span>
                  )}
                </div>
                <IconButton
                  clicked={() => handleDeleteClick(label.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-danger hover:text-danger-hover p-1">
                  <HiTrash className="w-5 h-5" />
                </IconButton>
              </ListItem>
            )}
          </List>
        </Container>
      )}

      <DeleteDialog
        title="Delete Label"
        content={
          labelToDeleteData
            ? `Are you sure you want to delete the label "${labelToDeleteData.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this label? This action cannot be undone."
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
