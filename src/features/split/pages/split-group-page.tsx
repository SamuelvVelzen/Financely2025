import { AddOrEditSplitGroupDialog } from "@/features/split/components/add-or-edit-split-group-dialog";
import type { ISplitGroupWizardStep } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitBalanceSummary } from "@/features/split/components/split-balance-summary";
import { SplitGroupActivityTabs } from "@/features/split/components/split-group-activity-tabs";
import { SplitExpenseDialog } from "@/features/split/components/split-expense-dialog";
import { SplitGroupDetailHeader } from "@/features/split/components/split-group-detail-header";
import { RecordSettlementDialog } from "@/features/split/components/record-settlement-dialog";
import {
  useDeleteSplitExpense,
  useDeleteSplitGroup,
  useDeleteSplitSettlement,
  useSplitBalances,
  useSplitExpenses,
  useSplitGroup,
  useSplitSettlements,
} from "@/features/split/hooks/use-split-groups";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import type { ISplitSettlement } from "@/features/split/utils/group-split-settlements-by-date";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { useMe } from "@/features/users/hooks/useUser";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import { Container } from "@/features/ui/container/container";
import { AvatarGroup } from "@/features/ui/avatar/avatar-group";
import { Button } from "@/features/ui/button/button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Skeleton } from "@/features/ui/skeleton";
import { IconButton } from "@/features/ui/button/icon-button";
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
  const { data: settlementsData, isLoading: settlementsLoading } =
    useSplitSettlements(groupId);
  const { data: balances, isLoading: balancesLoading } =
    useSplitBalances(groupId);
  const deleteExpense = useDeleteSplitExpense(groupId);
  const deleteSettlement = useDeleteSplitSettlement(groupId);
  const deleteGroup = useDeleteSplitGroup();
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ISplitExpense | undefined>();
  const [deletingExpense, setDeletingExpense] = useState<ISplitExpense | undefined>();
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupDialogInitialStep, setGroupDialogInitialStep] =
    useState<ISplitGroupWizardStep>("details");
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<
    ISplitSettlement | undefined
  >();
  const [deletingSettlement, setDeletingSettlement] = useState<
    ISplitSettlement | undefined
  >();

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

  const openGroupDialog = (step: ISplitGroupWizardStep = "details") => {
    setGroupDialogInitialStep(step);
    setGroupDialogOpen(true);
  };

  const openEditSettlement = (settlement: ISplitSettlement) => {
    setEditingSettlement(settlement);
    setSettleOpen(true);
  };

  const handleSettlementDialogOpenChange = (open: boolean) => {
    setSettleOpen(open);
    if (!open) {
      setEditingSettlement(undefined);
    }
  };

  const handleDeleteSettlementConfirm = () => {
    if (!deletingSettlement) {
      return;
    }
    deleteSettlement.mutate(deletingSettlement.id, {
      onSuccess: () => {
        toast.success("Settlement deleted");
        setDeletingSettlement(undefined);
      },
      onError: () => {
        toast.error("Could not delete settlement");
      },
    });
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
  const guestAccessToken = group.guestAccessToken as string | undefined;
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
        guestAccessToken={guestAccessToken}
        onBack={() => navigate({ to: "/splits" })}
        canEdit={isAdmin}
        onEdit={() => openGroupDialog("details")}
        canDelete={isCreator}
        onDelete={() => setDeleteGroupOpen(true)}
        onManageMembers={() => openGroupDialog("members")}
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
              <Button
                variant="default"
                clicked={() => {
                  setEditingSettlement(undefined);
                  setSettleOpen(true);
                }}>
                Settle up
              </Button>
              {!isMobile ? (
                <Button variant="primary" clicked={openCreateExpense}>
                  Add expense
                </Button>
              ) : null}
            </div>

            <button
              type="button"
              aria-label={`Manage people, ${members.length} in group`}
              onClick={() => openGroupDialog("members")}
              className="w-full text-left">
              <Container className="mb-0 cursor-pointer transition-colors hover:bg-surface-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-primary">
                <h2 className="mb-3 text-sm font-semibold text-text">People</h2>
                <AvatarGroup
                  items={members}
                  max={4}
                  size="sm"
                  showTotalCount
                />
              </Container>
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <SplitGroupActivityTabs
              expenses={expensesData?.expenses ?? []}
              settlements={(settlementsData?.settlements ?? []) as ISplitSettlement[]}
              groupCurrency={groupCurrency}
              expensesLoading={expensesLoading}
              settlementsLoading={settlementsLoading}
              viewer={viewer}
              onEditExpense={openEditExpense}
              onDeleteExpense={setDeletingExpense}
              onEditSettlement={openEditSettlement}
              onDeleteSettlement={setDeletingSettlement}
            />
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
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        initialStep={groupDialogInitialStep}
        group={{
          id: groupId,
          name: groupName,
          defaultCurrency: groupCurrency,
          expenseCount: expensesData?.expenses?.length ?? 0,
          guestAccessToken,
          members,
          currentMemberId,
          currentMemberRole,
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
      <RecordSettlementDialog
        key={settleOpen ? (editingSettlement?.id ?? "create") : "closed"}
        open={settleOpen}
        onOpenChange={handleSettlementDialogOpenChange}
        groupId={groupId}
        members={members}
        currency={groupCurrency}
        currentMemberId={currentMemberId}
        isAdmin={isAdmin}
        settlement={editingSettlement}
      />
      <DeleteDialog
        open={deletingSettlement != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSettlement(undefined);
          }
        }}
        title="Delete settlement"
        content="Delete this settlement? This cannot be undone."
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setDeletingSettlement(undefined),
          },
          {
            buttonContent: "Delete",
            variant: "danger",
            clicked: handleDeleteSettlementConfirm,
            loading: {
              isLoading: deleteSettlement.isPending,
              text: "Deleting settlement",
            },
          },
        ]}
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
