import type { ITransaction } from "@/features/shared/validation/schemas";
import { AddOrCreateTransactionDialog } from "@/features/transaction/components/add-or-create-transaction-dialog";
import { TransactionListGrouped } from "@/features/transaction/components/transaction-list-grouped";
import { useDeleteTransaction, useTransactions } from "@/features/transaction/hooks/useTransactions";
import { Button } from "@/features/ui/button/button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Spinner } from "@/features/ui/loading/spinner";
import { useToast } from "@/features/ui/toast";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { useState } from "react";
import { HiCheck, HiPlus } from "react-icons/hi";
import { HiArrowsRightLeft } from "react-icons/hi2";

export function TransactionSetup() {
  const { data: transactions, isLoading } = useTransactions();
  const { mutate: deleteTransaction } = useDeleteTransaction();
  const toast = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    ITransaction | undefined
  >(undefined);

  const handleCreateTransaction = () => {
    setSelectedTransaction(undefined);
    setIsDialogOpen(true);
  };

  const handleEditTransaction = (transaction: ITransaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (transaction: ITransaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTransaction) {
      deleteTransaction(selectedTransaction.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedTransaction(undefined);
          toast.success(
            `${selectedTransaction.type === "EXPENSE" ? "Expense" : "Income"} deleted successfully`
          );
        },
        onError: () => {
          toast.error("Failed to delete transaction");
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTransaction(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasTransactions = transactions && transactions.data.length > 0;

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <HiArrowsRightLeft className="size-8 text-primary" />
        </div>
        <Title className="text-2xl mb-2">Add Your First Transaction</Title>
        <Text
          isMuted
          className="max-w-md mx-auto">
          Track your spending by adding transactions. Start with a recent
          expense or income to see how it works.
        </Text>
      </div>

      {/* Existing transactions indicator */}
      {hasTransactions && (
        <div className="mb-6 p-4 bg-success/10 rounded-2xl border border-success/20">
          <div className="flex items-center gap-2">
            <HiCheck className="size-5 text-success" />
            <Text className="font-medium">
              You have {transactions.total} transaction
              {transactions.total !== 1 ? "s" : ""} recorded
            </Text>
          </div>
        </div>
      )}

      {/* Add transaction button */}
      <div className="text-center mb-6">
        <Button
          clicked={handleCreateTransaction}
          variant="primary"
          size="lg"
          className="gap-2">
          <HiPlus className="size-5" />
          Add Transaction
        </Button>
      </div>

      {/* Transaction list */}
      {hasTransactions && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <TransactionListGrouped
            data={transactions.data}
            searchQuery=""
            onDelete={handleDeleteClick}
            onEdit={handleEditTransaction}
          />
        </div>
      )}

      {/* Add/Edit Transaction Dialog */}
      <AddOrCreateTransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={selectedTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        title={`Delete ${selectedTransaction?.type === "EXPENSE" ? "Expense" : "Income"}`}
        content={`Are you sure you want to delete the ${selectedTransaction?.type === "EXPENSE" ? "expense" : "income"} "${selectedTransaction?.name}"? This action cannot be undone.`}
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
    </>
  );
}
