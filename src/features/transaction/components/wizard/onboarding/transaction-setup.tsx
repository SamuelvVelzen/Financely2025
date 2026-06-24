import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { AddOrEditTransactionDialog } from "@/features/transaction/components/add-or-edit-transaction-dialog";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-import/transaction-csv-import-dialog";
import { TransactionListGrouped } from "@/features/transaction/components/transaction-list-grouped";
import { TransactionTable } from "@/features/transaction/components/transaction-table";
import { TransactionViewControls } from "@/features/transaction/components/transaction-view-controls";
import type { ITransactionLayoutMode } from "@/features/transaction/hooks/use-transaction-view-mode";
import {
  useDeleteTransaction,
  useInfiniteTransactions,
} from "@/features/transaction/hooks/useTransactions";
import { Button } from "@/features/ui/button/button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Spinner } from "@/features/ui/loading/spinner";
import { useToast } from "@/features/ui/toast";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { useMemo, useState } from "react";
import { HiCheck, HiPlus } from "react-icons/hi";
import { HiArrowsRightLeft, HiArrowDownTray } from "react-icons/hi2";

export function TransactionSetup() {
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTransactions();
  const { mutate: deleteTransaction } = useDeleteTransaction();
  const toast = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [layout, setLayout] = useState<ITransactionLayoutMode>("list");
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<
    ITransaction | undefined
  >(undefined);

  const transactions = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

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
        onSuccess: (data) => {
          setIsDeleteDialogOpen(false);
          setSelectedTransaction(undefined);
          if (!isOfflineMutationPlaceholder(data)) {
            toast.success(
              `${selectedTransaction.type === "EXPENSE" ? "Expense" : "Income"} deleted successfully`,
            );
          }
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

  const hasTransactions = transactions.length > 0;

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
          Track your spending by adding transactions manually or import a CSV
          export from your bank to get started quickly.
        </Text>
      </div>

      {hasTransactions && (
        <div className="mb-6 p-4 bg-success/10 rounded-2xl border border-success/20">
          <div className="flex items-center gap-2">
            <HiCheck className="size-5 text-success shrink-0" />
            <Text className="font-medium">
              You have {total} transaction
              {total !== 1 ? "s" : ""} recorded
            </Text>
          </div>
        </div>
      )}

      {!hasTransactions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
          <button
            type="button"
            onClick={handleCreateTransaction}
            className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-border bg-surface hover:border-primary/50 hover:bg-primary/5 transition-all text-center cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <HiPlus className="size-6 text-primary" />
            </div>
            <div>
              <Text className="font-semibold mb-1">Add Manually</Text>
              <Text
                isMuted
                size="sm">
                Enter a recent expense or income
              </Text>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsCsvImportDialogOpen(true)}
            className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-border bg-surface hover:border-primary/50 hover:bg-primary/5 transition-all text-center cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <HiArrowDownTray className="size-6 text-primary" />
            </div>
            <div>
              <Text className="font-semibold mb-1">Import from CSV</Text>
              <Text
                isMuted
                size="sm">
                Upload a bank statement export
              </Text>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              clicked={handleCreateTransaction}
              variant="primary"
              size="md"
              className="gap-2">
              <HiPlus className="size-4" />
              Add Transaction
            </Button>
            <Button
              clicked={() => setIsCsvImportDialogOpen(true)}
              variant="default"
              size="md"
              className="gap-2">
              <HiArrowDownTray className="size-4" />
              Import from CSV
            </Button>
          </div>
          <TransactionViewControls
            layout={layout}
            showDescriptions={showDescriptions}
            onLayoutChange={setLayout}
            onShowDescriptionsChange={setShowDescriptions}
          />
        </div>
      )}

      {hasTransactions &&
        (layout === "list" ? (
          <TransactionListGrouped
            data={transactions}
            showDescription={showDescriptions}
            onDelete={handleDeleteClick}
            onEdit={handleEditTransaction}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        ) : (
          <TransactionTable
            data={transactions}
            searchQuery=""
            onDelete={handleDeleteClick}
            onEdit={handleEditTransaction}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        ))}

      <AddOrEditTransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={selectedTransaction}
      />

      {isCsvImportDialogOpen && (
        <TransactionCsvImportDialog
          open={isCsvImportDialogOpen}
          onOpenChange={setIsCsvImportDialogOpen}
        />
      )}

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
