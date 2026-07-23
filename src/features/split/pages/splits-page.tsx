import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AddOrEditSplitGroupDialog } from "@/features/split/components/add-or-edit-split-group-dialog";
import type { ISplitGroupDialogTarget } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupList } from "@/features/split/components/split-group-list";
import { SplitsOverviewHeader } from "@/features/split/components/splits-overview-header";
import { useDeleteSplitGroup } from "@/features/split/hooks/use-split-groups";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import { Container } from "@/features/ui/container/container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { useToast } from "@/features/ui/toast";

export function SplitsPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<
    ISplitGroupDialogTarget | undefined
  >();
  const [deletingGroup, setDeletingGroup] = useState<
    ISplitGroupDialogTarget | undefined
  >();
  const workspaceId = useNavWorkspaceId();
  const defaultCurrency = useDefaultCurrency(workspaceId);
  const deleteGroup = useDeleteSplitGroup();
  const toast = useToast();

  const openCreateDialog = () => {
    setEditingGroup(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (group: ISplitGroupDialogTarget) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingGroup(undefined);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingGroup) {
      return;
    }

    deleteGroup.mutate(deletingGroup.id, {
      onSuccess: () => {
        toast.success("Group deleted");
        setDeletingGroup(undefined);
      },
      onError: () => {
        toast.error("Could not delete group");
      },
    });
  };

  return (
    <>
      <SplitsOverviewHeader onCreateClick={openCreateDialog} />
      <Container>
        <SplitGroupList
          onCreateClick={openCreateDialog}
          onEdit={openEditDialog}
          onDelete={setDeletingGroup}
        />
      </Container>
      <AddOrEditSplitGroupDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        group={editingGroup}
        defaultCurrency={defaultCurrency}
        onSuccess={(groupId) => {
          if (!groupId) {
            return;
          }
          void navigate({
            to: "/splits/$groupId",
            params: { groupId },
          });
        }}
      />
      <DeleteDialog
        open={deletingGroup != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingGroup(undefined);
          }
        }}
        title="Delete group"
        content={`Delete "${deletingGroup?.name}"? All expenses, balances, and members will be removed. This cannot be undone.`}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setDeletingGroup(undefined),
          },
          {
            buttonContent: "Delete",
            variant: "danger",
            clicked: handleDeleteConfirm,
            loading: {
              isLoading: deleteGroup.isPending,
              text: "Deleting group",
            },
          },
        ]}
      />
    </>
  );
}
