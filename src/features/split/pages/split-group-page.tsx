import { AddSplitMemberDialog } from "@/features/split/components/add-split-member-dialog";
import { AddOrEditSplitGroupDialog } from "@/features/split/components/add-or-edit-split-group-dialog";
import { SplitBalanceSummary } from "@/features/split/components/split-balance-summary";
import { SplitExpenseDialog } from "@/features/split/components/split-expense-dialog";
import { SplitExpenseList } from "@/features/split/components/split-expense-list";
import { SplitGroupDetailHeader } from "@/features/split/components/split-group-detail-header";
import { SplitMembersSection } from "@/features/split/components/split-members-section";
import { RecordSettlementDialog } from "@/features/split/components/record-settlement-dialog";
import {
  useDeleteSplitExpense,
  useDeleteSplitGroup,
  useSplitBalances,
  useSplitExpenses,
  useSplitGroup,
} from "@/features/split/hooks/use-split-groups";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { useMe } from "@/features/users/hooks/useUser";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import { Container } from "@/features/ui/container/container";
import { Button } from "@/features/ui/button/button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Skeleton } from "@/features/ui/skeleton";
import { IconButton } from "@/features/ui/button/icon-button";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { HiPlus } from "react-icons/hi2";
import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

export function SplitGroupPage() {
  const { groupId } = useParams({ from: "/(app)/splits/$groupId/" });
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { data: me } = useMe();
  const workspaceId = useNavWorkspaceId();
  const defaultCurrency = useDefaultCurrency(workspaceId);
  const toast = useToast();
  const { data: group, isLoading: groupLoading } = useSplitGroup(groupId);
  const { data: expensesData, isLoading: expensesLoading } =
    useSplitExpenses(groupId);
  const { data: balances, isLoading: balancesLoading } =
    useSplitBalances(groupId);
  const deleteExpense = useDeleteSplitExpense(groupId);
  const deleteGroup = useDeleteSplitGroup();
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ISplitExpense | undefined>();
  const [deletingExpense, setDeletingExpense] = useState<ISplitExpense | undefined>();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);

  const openCreateExpense = () => {
    setEditingExpense(undefined);
    setExpenseDialogOpen(true);
  };

  const openEditExpense = (expense: ISplitExpense) => {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  };

  const handleExpenseDialogOpenChange = (open: boolean) => {
    setExpenseDialogOpen(open);
    if (!open) {
      setEditingExpense(undefined);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingExpense) {
      return;
    }
    deleteExpense.mutate(deletingExpense.id, {
      onSuccess: () => {
        toast.success("Expense deleted");
        setDeletingExpense(undefined);
      },
      onError: () => {
        toast.error("Could not delete expense");
      },
    });
  };

  const handleDeleteGroupConfirm = () => {
    deleteGroup.mutate(groupId, {
      onSuccess: () => {
        toast.success("Group deleted");
        navigate({ to: "/splits" });
      },
      onError: () => {
        toast.error("Could not delete group");
      },
    });
  };

  if (groupLoading) {
    return (
      <Container>
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (!group) {
    return (
      <Container>
        <p className="text-text-muted py-8 text-center">Group not found</p>
      </Container>
    );
  }

  const members =
    (group.members as Array<{ id: string; displayName: string; status?: string }>) ??
    [];
  const currentMemberId = group.currentMemberId as string;
  const currentMemberRole = group.currentMemberRole as string;
  const groupCurrency = group.defaultCurrency as string;
  const groupName = group.name as string;
  const isAdmin = currentMemberRole === "admin";
  const isCreator = group.isCreator as boolean;
  const viewer = {
    userId: me?.id ?? "",
    memberId: currentMemberId,
    role: currentMemberRole,
  };

  return (
    <>
      <SplitGroupDetailHeader
        groupName={groupName}
        currency={groupCurrency}
        onBack={() => navigate({ to: "/splits" })}
        canEdit={isAdmin}
        onEdit={() => setEditGroupOpen(true)}
        canDelete={isCreator}
        onDelete={() => setDeleteGroupOpen(true)}
      />

      <Container>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80 shrink-0 space-y-4">
            {!balancesLoading && balances ? (
              <SplitBalanceSummary
                balances={
                  balances as Parameters<typeof SplitBalanceSummary>[0]["balances"]
                }
              />
            ) : (
              <Skeleton className="h-32 w-full" />
            )}

            <div className="flex flex-col gap-2">
              <Button variant="secondary" clicked={() => setSettleOpen(true)}>
                Settle up
              </Button>
              {!isMobile ? (
                <Button variant="primary" clicked={openCreateExpense}>
                  Add expense
                </Button>
              ) : null}
            </div>

            <SplitMembersSection
              members={members}
              onAddMember={() => setAddMemberOpen(true)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text mb-4">Expenses</h2>
            {expensesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading text="Loading expenses" />
              </div>
            ) : (
              <SplitExpenseList
                expenses={expensesData?.expenses ?? []}
                groupCurrency={groupCurrency}
                viewer={viewer}
                onEdit={openEditExpense}
                onDelete={setDeletingExpense}
              />
            )}
          </div>
        </div>
      </Container>

      {isMobile ? (
        <IconButton
          variant="primary"
          ariaLabel="Add expense"
          clicked={openCreateExpense}
          className="fixed bottom-24 right-4 z-40 size-14 rounded-full shadow-lg md:hidden">
          <HiPlus className="size-7" />
        </IconButton>
      ) : null}

      <SplitExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={handleExpenseDialogOpenChange}
        groupId={groupId}
        groupCurrency={groupCurrency}
        expenses={expensesData?.expenses ?? []}
        members={members}
        currentMemberId={currentMemberId}
        expense={editingExpense}
        onSwitchToCreate={() => setEditingExpense(undefined)}
      />
      <AddOrEditSplitGroupDialog
        open={editGroupOpen}
        onOpenChange={setEditGroupOpen}
        group={{
          id: groupId,
          name: groupName,
          defaultCurrency: groupCurrency,
          expenseCount: expensesData?.expenses?.length ?? 0,
        }}
        defaultCurrency={defaultCurrency}
      />
      <DeleteDialog
        open={deleteGroupOpen}
        onOpenChange={setDeleteGroupOpen}
        title="Delete group"
        content={`Delete "${groupName}"? All expenses, balances, and members will be removed. This cannot be undone.`}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setDeleteGroupOpen(false),
          },
          {
            buttonContent: "Delete",
            variant: "danger",
            clicked: handleDeleteGroupConfirm,
            loading: {
              isLoading: deleteGroup.isPending,
              text: "Deleting group",
            },
          },
        ]}
      />
      <AddSplitMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        groupId={groupId}
      />
      <RecordSettlementDialog
        open={settleOpen}
        onOpenChange={setSettleOpen}
        groupId={groupId}
        members={members}
        currency={groupCurrency}
        currentMemberId={currentMemberId}
      />
      <DeleteDialog
        open={deletingExpense != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingExpense(undefined);
          }
        }}
        title="Delete expense"
        content={`Delete "${deletingExpense?.description}"? This cannot be undone.`}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setDeletingExpense(undefined),
          },
          {
            buttonContent: "Delete",
            variant: "danger",
            clicked: handleDeleteConfirm,
            loading: {
              isLoading: deleteExpense.isPending,
              text: "Deleting expense",
            },
          },
        ]}
      />
    </>
  );
}
